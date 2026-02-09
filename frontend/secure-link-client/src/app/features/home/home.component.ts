import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SecureLinkApiService } from '../../core/api/secure-link-api.service';
import { AppHttpError } from '../../core/interceptors/error.interceptor';
import { LinkResponse } from '../../models/link.models';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly api = inject(SecureLinkApiService);

  protected readonly targetUrl = signal('');
  protected selectedFile: File | null = null;

  protected readonly durationValue = signal<number | null>(null);
  protected readonly durationUnit = signal<'minutes' | 'hours' | 'days' | 'seconds'>('minutes');
  protected readonly maxViews = signal<number | null>(null);
  protected readonly password = signal('');

  protected readonly loading = signal(false);
  protected readonly result = signal<LinkResponse | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly helperInput = signal('');
  protected readonly helperPassword = signal('');
  protected readonly showPasswordModal = signal(false);

  protected readonly revokeCode = signal('');
  protected readonly revokeMessage = signal('');

  protected readonly hasUrl = computed(() => this.targetUrl().trim().length > 0);
  protected readonly hasFile = computed(() => !!this.selectedFile);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile) this.targetUrl.set('');
  }

  protected clearFile(): void {
    this.selectedFile = null;
  }

  protected onUrlChange(value: string): void {
    this.targetUrl.set(value);
    if (value.trim()) this.selectedFile = null;
  }

  protected createLink(): void {
    this.errorMessage.set('');
    this.result.set(null);

    const expiresAt = this.buildExpirationIso();
    const maxViews = this.maxViews();
    const password = this.password().trim() || undefined;

    if (!this.hasUrl() && !this.hasFile()) {
      this.errorMessage.set('Provide a URL or file.');
      return;
    }

    this.loading.set(true);
    const request$ = this.hasFile()
      ? this.api.uploadFile(this.selectedFile!, { expiresAt, maxViews: maxViews ?? undefined, password })
      : this.api.createLink({
          targetUrl: this.targetUrl().trim(),
          expiresAt,
          maxViews: maxViews ?? undefined,
          password,
        });

    request$.subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: (error: AppHttpError) => {
        this.errorMessage.set(this.decorateError(error));
        this.loading.set(false);
      },
    });
  }

  protected copyResult(url: string): void {
    navigator.clipboard.writeText(url);
  }

  protected openResult(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected tryOpenSecureLink(): void {
    this.errorMessage.set('');
    const shortCode = this.extractShortCode(this.helperInput());
    if (!shortCode) {
      this.errorMessage.set('Enter a valid shortCode or URL /l/{shortCode}.');
      return;
    }

    this.api.openLink(shortCode).subscribe({
      next: (result) => {
        if (result.type === 'file' && result.blob) {
          this.downloadBlob(result.blob, `secure-link-${shortCode}`);
        }
      },
      error: (error: AppHttpError) => {
        if (error.status === 401 && error.message === 'Password required') {
          this.showPasswordModal.set(true);
          return;
        }
        this.errorMessage.set(this.decorateError(error));
      },
    });
  }

  protected retryWithPassword(): void {
    const shortCode = this.extractShortCode(this.helperInput());
    if (!shortCode) return;

    this.api.openLink(shortCode, this.helperPassword()).subscribe({
      next: (result) => {
        this.showPasswordModal.set(false);
        this.helperPassword.set('');
        if (result.type === 'file' && result.blob) {
          this.downloadBlob(result.blob, `secure-link-${shortCode}`);
        }
      },
      error: (error: AppHttpError) => {
        this.errorMessage.set(this.decorateError(error));
      },
    });
  }

  protected revoke(): void {
    const shortCode = this.extractShortCode(this.revokeCode());
    if (!shortCode) {
      this.revokeMessage.set('Invalid shortCode.');
      return;
    }

    const confirmed = window.confirm(`Revoke link ${shortCode}?`);
    if (!confirmed) return;

    this.api.revokeLink(shortCode).subscribe({
      next: () => this.revokeMessage.set('Link revoked.'),
      error: (error: AppHttpError) => this.revokeMessage.set(this.decorateError(error)),
    });
  }

  private buildExpirationIso(): string | undefined {
    const duration = this.durationValue();
    if (!duration || duration < 1) return undefined;

    const now = new Date();
    const multiplier: Record<string, number> = {
      seconds: 1000,
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000,
    };

    return new Date(now.getTime() + duration * multiplier[this.durationUnit()]).toISOString();
  }

  private extractShortCode(input: string): string {
    const value = input.trim();
    if (!value) return '';

    const match = value.match(/\/l\/([A-Za-z0-9_-]+)/);
    if (match?.[1]) return match[1];

    return value.replace(/[^A-Za-z0-9_-]/g, '');
  }

  private downloadBlob(blob: Blob, baseName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = baseName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private decorateError(error: AppHttpError): string {
    return error.errorId ? `${error.message} (errorId: ${error.errorId})` : error.message;
  }
}
