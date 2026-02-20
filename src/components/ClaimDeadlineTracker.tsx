import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';

interface ClaimDeadlineTrackerProps {
  checkOutDate: string | null;
  bookingPlatform: string | null;
  claimStatus: string | null;
  claimDeadline: string | null;
}

const PLATFORM_DEADLINES: Record<string, number> = {
  airbnb: 14,
  vrbo: 60,
  direct_booking: 30,
  other: 30,
};

export function ClaimDeadlineTracker({ checkOutDate, bookingPlatform, claimStatus, claimDeadline }: ClaimDeadlineTrackerProps) {
  if (!checkOutDate) return null;

  const isFiled = claimStatus && !['not_filed'].includes(claimStatus);
  const platformDays = PLATFORM_DEADLINES[bookingPlatform || 'other'] || 30;
  const deadlineDate = claimDeadline
    ? new Date(claimDeadline + 'T12:00:00')
    : addDays(new Date(checkOutDate + 'T12:00:00'), platformDays);
  const daysRemaining = differenceInDays(deadlineDate, new Date());

  const platformLabel = bookingPlatform === 'airbnb' ? 'Airbnb AirCover' :
    bookingPlatform === 'vrbo' ? 'VRBO' :
    bookingPlatform === 'direct_booking' ? 'Direct Booking' : 'Platform';

  if (isFiled) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium">Claim Filed</p>
            <p className="text-xs text-muted-foreground">
              Status: {(claimStatus || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;

  return (
    <Card className={isOverdue ? 'border-destructive/50 bg-destructive/5' : isUrgent ? 'border-warning/50 bg-warning/5' : 'border-primary/30 bg-primary/5'}>
      <CardContent className="p-4 flex items-center gap-3">
        {isOverdue ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Clock className={`h-5 w-5 ${isUrgent ? 'text-warning' : 'text-primary'}`} />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {isOverdue ? 'Claim Deadline Passed!' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
            </p>
            <Badge variant={isOverdue ? 'destructive' : isUrgent ? 'secondary' : 'outline'} className="text-xs">
              {platformLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Deadline: {format(deadlineDate, 'PPP')} • {platformDays}-day window from checkout
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
