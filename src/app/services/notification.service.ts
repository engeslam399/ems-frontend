import { Injectable, signal, computed } from '@angular/core';

export interface NotificationState {
  message: string | null;
  type: 'success' | 'error' | null;
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private state = signal<NotificationState>({
    message: null,
    type: null,
    show: false
  });

  // Expose read-only state for UI bindings
  readonly currentNotification = computed(() => this.state());

  private timeoutId: any = null;

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  showError(message: string) {
    this.show(message, 'error');
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.state.set({ message: null, type: null, show: false });
  }

  private show(message: string, type: 'success' | 'error') {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.state.set({ message, type, show: true });

    this.timeoutId = setTimeout(() => {
      this.clear();
    }, 4000);
  }
}
