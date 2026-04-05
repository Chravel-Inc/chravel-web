import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function SmsTerms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">SMS Terms &amp; Consent</h1>

          <p className="text-muted-foreground mb-6">
            <strong>Last Updated:</strong> April 5, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What is Chravel SMS?</h2>
            <p className="text-foreground/90 mb-4">
              Chravel is a group travel coordination app. We send <strong>transactional SMS
              notifications</strong> to keep trip participants informed about time-sensitive trip
              activity. These messages are operational — not marketing or promotional.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How Users Opt In</h2>
            <p className="text-foreground/90 mb-4">
              SMS notifications are available to users on a paid subscription plan (Explorer,
              Frequent Chraveler, or Pro). Opting in requires the following explicit steps:
            </p>
            <ol className="list-decimal list-inside text-foreground/90 space-y-2 mb-4">
              <li>
                Navigate to <strong>Settings → Notifications</strong> within the Chravel app.
              </li>
              <li>
                Toggle <strong>"Enable SMS Notifications"</strong> to ON.
              </li>
              <li>
                Enter and verify your mobile phone number.
              </li>
              <li>
                Receive a confirmation SMS:&nbsp;
                <em>
                  "ChravelApp: You've enabled SMS notifications. Reply STOP to unsubscribe at any
                  time. Msg &amp; data rates may apply."
                </em>
              </li>
            </ol>
            <p className="text-foreground/90 mb-4">
              SMS notifications are <strong>never enabled by default</strong>. Users must
              affirmatively opt in through the in-app toggle described above.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Message Categories</h2>
            <p className="text-foreground/90 mb-4">
              Users may receive SMS notifications for the following trip-related activities:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 mb-4">
              <li>Calendar event reminders (e.g., upcoming flights, dinners, meetings)</li>
              <li>Broadcast alerts from trip organizers</li>
              <li>Payment requests and settlement confirmations</li>
              <li>Task assignments and completions</li>
              <li>Poll notifications and results</li>
              <li>Trip join requests and approvals</li>
              <li>Basecamp location updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Message Frequency</h2>
            <p className="text-foreground/90 mb-4">
              Message frequency depends on trip activity. Users can expect to receive{' '}
              <strong>up to 10 SMS messages per day</strong>. Most users receive fewer than 5
              messages per day. There are no recurring automated marketing messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. How to Opt Out</h2>
            <p className="text-foreground/90 mb-4">
              Users can stop receiving SMS notifications at any time by:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 mb-4">
              <li>
                <strong>Replying STOP</strong> to any SMS message received from Chravel.
              </li>
              <li>
                Navigating to <strong>Settings → Notifications</strong> in the Chravel app and
                toggling <strong>"Enable SMS Notifications"</strong> to OFF.
              </li>
            </ul>
            <p className="text-foreground/90 mb-4">
              After opting out, users will receive a final confirmation message:&nbsp;
              <em>
                "ChravelApp: You have been unsubscribed and will no longer receive SMS messages.
                Reply START to re-subscribe."
              </em>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Message &amp; Data Rates</h2>
            <p className="text-foreground/90 mb-4">
              Standard message and data rates may apply depending on your mobile carrier and plan.
              Chravel does not charge separately for SMS notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy &amp; Data Use</h2>
            <p className="text-foreground/90 mb-4">
              Phone numbers collected for SMS notifications are used solely for delivering
              transactional trip notifications. We do not sell, share, or use phone numbers for
              marketing purposes. For full details, see our{' '}
              <Link to="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="text-primary underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Help &amp; Contact</h2>
            <p className="text-foreground/90 mb-4">
              For help with SMS notifications, reply <strong>HELP</strong> to any message or contact
              us:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 mb-4">
              <li>
                Email:{' '}
                <a href="mailto:support@chravelapp.com" className="text-primary underline">
                  support@chravelapp.com
                </a>
              </li>
              <li>
                Privacy inquiries:{' '}
                <a href="mailto:privacy@chravelapp.com" className="text-primary underline">
                  privacy@chravelapp.com
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
