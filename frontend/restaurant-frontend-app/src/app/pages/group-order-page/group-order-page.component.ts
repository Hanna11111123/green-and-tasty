import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { Participant } from '@app/models/group-orders/participant.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';
import { consolidatePreOrder } from '@app/shared/helpers/consolidate-pre-order';

type PageError = 'not-found' | 'generic' | null;

@Component({
  selector: 'app-group-order-page',
  imports: [ParticipantCardComponent, ModalComponent, CurrencyPipe, DatePipe],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent implements OnInit {
  private readonly groupOrders = inject(GroupOrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reservationId = this.route.snapshot.paramMap.get('reservationId') ?? '';
  private groupId = '';

  readonly loading = signal(true);
  readonly error = signal<PageError>(null);
  readonly invite = signal<GuestInvite | null>(null);
  readonly participants = signal<Participant[]>([]);
  readonly ownerSessionId = signal('');
  readonly status = signal<GroupStatusResponse | null>(null);
  readonly confirmOpen = signal(false);
  readonly submitting = signal(false);

  readonly isSent = computed(() => this.status()?.status === 'Submitted');
  readonly consolidated = computed(() => consolidatePreOrder(this.participants()));
  readonly pendingCount = computed(() => this.participants().filter((person) => !person.isSubmitted).length);
  readonly hasNoDishes = computed(() => this.participants().every((person) => person.items.length === 0));
  readonly canSubmit = computed(() => this.consolidated().items.length > 0 && !this.submitting());
  readonly badge = computed(() => {
    switch (this.status()?.status) {
      case 'Submitted':
        return 'Sent to Restaurant';
      case 'Closed':
        return 'Closed';
      default:
        return 'Collecting pre-orders';
    }
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupOrders
      .getGroupInvite$(this.reservationId)
      .pipe(
        switchMap((invite) => {
          this.invite.set(invite);
          this.groupId = invite.GroupReservationId;
          return forkJoin({
            sessions: this.groupOrders.getSessions$(this.groupId),
            ownerSessionId: this.groupOrders.getOwnerSessionId$(this.reservationId),
            status: this.groupOrders.getStatus$(this.groupId),
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ sessions, ownerSessionId, status }) => {
          this.participants.set(sessions.participants);
          this.ownerSessionId.set(ownerSessionId);
          this.status.set(status);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(err instanceof HttpErrorResponse && err.status === 404 ? 'not-found' : 'generic');
          this.loading.set(false);
        },
      });
  }

  openConfirm(): void {
    if (this.canSubmit()) {
      this.confirmOpen.set(true);
    }
  }

  closeConfirm(): void {
    if (!this.submitting()) {
      this.confirmOpen.set(false);
    }
  }

  confirmSubmit(): void {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);

    this.groupOrders
      .submit$(this.groupId, this.reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.status.update((current) => ({
            currentParticipants: current?.currentParticipants ?? this.participants().length,
            maxCapacity: current?.maxCapacity ?? this.invite()?.MaxGuestCount ?? 0,
            status: 'Submitted',
          }));
          this.toast.success('Pre-order sent to the restaurant');
          this.submitting.set(false);
          this.confirmOpen.set(false);
        },
        // The error toast is already shown by tokenInterceptor.
        error: () => {
          this.submitting.set(false);
          this.confirmOpen.set(false);
        },
      });
  }
}
