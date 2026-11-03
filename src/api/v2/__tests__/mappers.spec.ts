import {
  toLegacyOrderStatus,
  toLegacyUserBalance,
  toLegacyUserStatus,
  toWireOrderStatus,
} from '@/api/v2/mappers';
import type { OrderView } from '@/api/v2/types';

type OrderDetail = Pick<OrderView, 'closeReason' | 'endedEarlyBy'>;

const detail = (part: Partial<OrderDetail>): OrderDetail => ({
  closeReason: null,
  endedEarlyBy: null,
  ...part,
});

describe('toLegacyUserBalance', () => {
  it('adds the pending money into balance but keeps it out of activeBalance', () => {
    const wallet = {
      walletId: 'w-1',
      availableBalance: 10000,
      pendingBalance: 5000,
    };
    const mapped = toLegacyUserBalance(wallet);
    expect(mapped).toEqual({
      id: 'w-1',
      balance: 15000,
      activeBalance: 10000,
    });
  });

  it('lets a screen recover the pending amount by subtraction', () => {
    // personal.tsx shows "Đang chờ về ví" as balance - activeBalance, so the
    // two fields have to stay consistent with the wallet they came from.
    const wallet = {
      walletId: 'w-2',
      availableBalance: 250000,
      pendingBalance: 70000,
    };
    const { balance, activeBalance } = toLegacyUserBalance(wallet);
    expect(balance - activeBalance).toBe(wallet.pendingBalance);
  });

  it('reads as spendable when nothing is pending', () => {
    const mapped = toLegacyUserBalance({
      walletId: 'w-3',
      availableBalance: 0,
      pendingBalance: 0,
    });
    expect(mapped).toEqual({ id: 'w-3', balance: 0, activeBalance: 0 });
  });
});

describe('toLegacyOrderStatus', () => {
  it('labels a plain lifecycle stage', () => {
    expect(toLegacyOrderStatus('PROPOSED')).toBe('Processing');
    expect(toLegacyOrderStatus('SCHEDULED')).toBe('Scheduled');
    expect(toLegacyOrderStatus('LIVE')).toBe('Starting');
    expect(toLegacyOrderStatus('DISPUTED')).toBe('Disputed');
    expect(toLegacyOrderStatus('SETTLED')).toBe('Finish');
  });

  it('splits the closed outcomes by the reason the API now sends separately', () => {
    const closed = (closeReason: OrderDetail['closeReason']): string =>
      toLegacyOrderStatus('CLOSED', detail({ closeReason }));
    expect(closed('REJECTED_BY_PLAYER')).toBe('Reject');
    expect(closed('CANCELLED_BY_HIRER')).toBe('Cancel');
    expect(closed('EXPIRED')).toBe('OverTime');
    expect(closed('INTERRUPTED_BY_ADMIN')).toBe('Interrupt');
    expect(closed(null)).toBe('Cancel');
  });

  it('splits an early finish by who ended it', () => {
    expect(toLegacyOrderStatus('ENDED_EARLY', detail({ endedEarlyBy: 'HIRER' }))).toBe(
      'Hirer Finish Soon',
    );
    expect(toLegacyOrderStatus('ENDED_EARLY', detail({ endedEarlyBy: 'PLAYER' }))).toBe(
      'Player Finish Soon',
    );
    expect(toLegacyOrderStatus('ENDED_EARLY', detail({ endedEarlyBy: null }))).toBe(
      'Finish',
    );
  });

  it('maps every legacy label back to a wire status the filter can send', () => {
    (
      [
        'Processing',
        'Scheduled',
        'Starting',
        'Disputed',
        'Finish',
        'Cancel',
        'Reject',
        'OverTime',
        'Interrupt',
        'Hirer Finish Soon',
        'Player Finish Soon',
      ] as const
    ).forEach((label) => {
      expect(toWireOrderStatus(label)).not.toBeUndefined();
    });
    expect(toWireOrderStatus('Reject')).toBe('CLOSED');
    expect(toWireOrderStatus('Player Finish Soon')).toBe('ENDED_EARLY');
    expect(toWireOrderStatus('')).toBeUndefined();
  });
});

describe('toLegacyUserStatus', () => {
  it('translates the known codes and passes anything else through', () => {
    expect(toLegacyUserStatus('BUSY')).toBe('Hiring');
    expect(toLegacyUserStatus('MAINTAIN')).toBe('Maintain');
    expect(toLegacyUserStatus('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(toLegacyUserStatus(null)).toBe('');
  });
});
