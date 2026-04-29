import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MessageActions } from '../MessageActions';

describe('MessageActions thread labels', () => {
  it('renders updated thread action labels', () => {
    render(
      <MessageActions
        messageId="m-1"
        messageContent="hello"
        messageType="trip"
        isOwnMessage={false}
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button'));

    expect(screen.getByText('Reply in thread')).toBeInTheDocument();
    expect(screen.getByText('View thread')).toBeInTheDocument();
    expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    expect(screen.queryByText('Open thread')).not.toBeInTheDocument();
  });
});
