-- Places P2: dual base-camp schema staleness.
--
-- Base camps are written canonically to trip_base_camps (BasecampsPanel / useMultiBaseCamps), while
-- several surfaces still read the legacy trips.basecamp_* mirror: the Pro trip header
-- (ProTripDetailDesktop, MobileProTripDetail), the trip export (tripExportDataService), and
-- useTripBasecamp. The panel's legacy write is explicitly best-effort ("never blocks"), so the
-- mirror drifts:
--   * adding a SECOND camp leaves the mirror pointing at whichever was written last,
--   * deleting one camp can blank the mirror while camps still exist,
--   * a failed/skipped legacy write leaves the mirror stale indefinitely.
-- Result: Pro screens and exports show a wrong or missing base camp.
--
-- Rather than repointing three read paths (two of which sit on the critical trip-detail render),
-- keep the mirror correct at the source: whenever trip_base_camps changes, recompute the trip's
-- primary camp and mirror it into trips.basecamp_*. Every legacy reader then becomes correct with
-- no client change and no risk to trip loading.
--
-- Regression scope: writes only the basecamp_* display columns of the SAME trip, derived from that
-- trip's own camps. It cannot affect trip existence/fetch (no Trip Not Found), auth hydration, RLS
-- visibility (no policy change; no cross-trip read or write), or payment state.
--
-- Primary camp = the camp whose date window covers today (if any), else the lowest order_index,
-- tie-broken by created_at. When no camps remain the mirror is cleared, so a deleted last camp does
-- not leave a phantom base camp on the Pro header/export.

CREATE OR REPLACE FUNCTION public.sync_primary_base_camp_to_trip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip_id TEXT := COALESCE(NEW.trip_id, OLD.trip_id);
  v_camp public.trip_base_camps%ROWTYPE;
BEGIN
  SELECT *
  INTO v_camp
  FROM public.trip_base_camps
  WHERE trip_id = v_trip_id
  ORDER BY
    (CASE
       WHEN (start_date IS NULL OR start_date <= CURRENT_DATE)
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       THEN 0 ELSE 1
     END),
    order_index,
    created_at
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.trips
    SET basecamp_name = COALESCE(NULLIF(v_camp.label, ''), NULLIF(v_camp.place_name, '')),
        basecamp_address = v_camp.address,
        basecamp_latitude = v_camp.lat,
        basecamp_longitude = v_camp.lng,
        basecamp_version = COALESCE(basecamp_version, 0) + 1
    WHERE id = v_trip_id;
  ELSE
    -- No camps left — clear the mirror instead of leaving the last-known value behind.
    UPDATE public.trips
    SET basecamp_name = NULL,
        basecamp_address = NULL,
        basecamp_latitude = NULL,
        basecamp_longitude = NULL,
        basecamp_version = COALESCE(basecamp_version, 0) + 1
    WHERE id = v_trip_id;
  END IF;

  RETURN NULL; -- AFTER trigger
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_primary_base_camp ON public.trip_base_camps;
CREATE TRIGGER trg_sync_primary_base_camp
AFTER INSERT OR UPDATE OR DELETE ON public.trip_base_camps
FOR EACH ROW
EXECUTE FUNCTION public.sync_primary_base_camp_to_trip();

-- Backfill: reconcile every trip that already has canonical camps so existing drift is corrected.
DO $backfill$
DECLARE
  r RECORD;
  v_camp public.trip_base_camps%ROWTYPE;
BEGIN
  FOR r IN SELECT DISTINCT trip_id FROM public.trip_base_camps LOOP
    SELECT *
    INTO v_camp
    FROM public.trip_base_camps
    WHERE trip_id = r.trip_id
    ORDER BY
      (CASE
         WHEN (start_date IS NULL OR start_date <= CURRENT_DATE)
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
         THEN 0 ELSE 1
       END),
      order_index,
      created_at
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.trips
      SET basecamp_name = COALESCE(NULLIF(v_camp.label, ''), NULLIF(v_camp.place_name, '')),
          basecamp_address = v_camp.address,
          basecamp_latitude = v_camp.lat,
          basecamp_longitude = v_camp.lng
      WHERE id = r.trip_id
        AND (COALESCE(basecamp_address, '') IS DISTINCT FROM COALESCE(v_camp.address, ''));
    END IF;
  END LOOP;
END;
$backfill$;
