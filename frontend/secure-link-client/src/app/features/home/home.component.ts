import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { LinksApiService } from '../../core/api/links-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError, LinkResponse } from '../../shared/models/api.models';

type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days';
type ActiveTab = 'create' | 'open' | 'revoke';
type CreateInputMode = 'empty' | 'url' | 'file';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly linksApi = inject(LinksApiService);
  private readonly toastService = inject(ToastService);

  readonly durationUnits: DurationUnit[] = ['seconds', 'minutes', 'hours', 'days'];
  readonly activeTab = signal<ActiveTab>('create');
  readonly generatedLink = signal<LinkResponse | null>(null);
  readonly apiError = signal<ApiError | null>(null);
  readonly isSubmitting = signal(false);
  readonly chosenFile = signal<File | null>(null);
  readonly copied = signal(false);
  readonly isDragOver = signal(false);

  readonly openError = signal<ApiError | null>(null);
  readonly openLoading = signal(false);
  readonly passwordModalOpen = signal(false);
  readonly passwordRetryError = signal('');

  readonly showCreatePassword = signal(false);
  readonly showRetryPassword = signal(false);

  readonly revokeLoading = signal(false);
  readonly revokeFeedback = signal<{ kind: 'success' | 'error'; message: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    targetUrl: ['', [Validators.pattern(/^https?:\/\/.+/i)]],
    durationValue: [30, [Validators.min(1), Validators.max(3650)]],
    durationUnit: ['minutes' as DurationUnit],
    maxViews: [null as number | null, [Validators.min(1), Validators.max(100)]],
    password: ['']
  });

  readonly helperForm = this.fb.nonNullable.group({ resource: [''] });
  readonly passwordForm = this.fb.nonNullable.group({ password: ['', [Validators.required]] });
  readonly revokeForm = this.fb.nonNullable.group({ shortCode: [''] });

  getCreateInputMode(): CreateInputMode {
    if (this.form.controls.targetUrl.value.trim()) {
      return 'url';
    }

    if (this.chosenFile()) {
      return 'file';
    }

    return 'empty';
  }

  isSubmitDisabled(): boolean {
    const mode = this.getCreateInputMode();

    return this.isSubmitting() || (mode === 'url' ? this.form.controls.targetUrl.invalid : mode === 'file' ? !this.chosenFile() : true);
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.apiError.set(null);
    this.openError.set(null);
    this.revokeFeedback.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.item(0) ?? null);
  }

  onUrlChanged(): void {
    if (this.form.controls.targetUrl.value.trim()) {
      this.chosenFile.set(null);
    }
  }

  sanitizeNumberField(field: 'durationValue' | 'maxViews', event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D+/g, '');

    if (field === 'maxViews' && digits === '') {
      this.form.controls.maxViews.setValue(null);
      input.value = '';
      return;
    }

    const value = digits === '' ? '' : String(Number(digits));
    input.value = value;

    if (field === 'durationValue') {
      this.form.controls.durationValue.setValue(value === '' ? 1 : Number(value));
      return;
    }

    this.form.controls.maxViews.setValue(value === '' ? null : Number(value));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.setFile(event.dataTransfer?.files?.item(0) ?? null);
  }

  clearFile(): void {
    this.chosenFile.set(null);
  }

  clearUrl(): void {
    this.form.controls.targetUrl.setValue('');
  }

  submit(): void {
    if (this.isSubmitDisabled()) {
      return;
    }

    this.apiError.set(null);
    this.generatedLink.set(null);
    this.isSubmitting.set(true);

    const expiresAt = this.toExpiresAt(
      this.form.controls.durationValue.value,
      this.form.controls.durationUnit.value
    );

    const maxViews = this.form.controls.maxViews.value ?? undefined;
    const password = this.form.controls.password.value.trim() || undefined;

    const request$ =
      this.getCreateInputMode() === 'url'
        ? this.linksApi.createLink({
            targetUrl: this.form.controls.targetUrl.value.trim(),
            expiresAt,
            maxViews,
            password
          })
        : this.linksApi.uploadLink(this.chosenFile()!, { expiresAt, maxViews, password });

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.generatedLink.set(response);
          this.copied.set(false);
          this.toastService.show({ kind: 'success', title: 'Link criado', message: response.shortCode });
        },
        error: (error: ApiError) => this.apiError.set(error)
      });
  }

  copyLink(value?: string): void {
    const link = value || this.generatedLink()?.accessUrl;
    if (!link) {
      return;
    }

    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  openGeneratedLink(): void {
    const link = this.generatedLink()?.accessUrl;
    if (link) {
      window.open(link, '_blank', 'noopener');
    }
  }

  tryOpenSecureLink(): void {
    const shortCode = this.extractShortCode(this.helperForm.controls.resource.value.trim());
    if (!shortCode) {
      this.openError.set({ status: 400, message: 'Enter a shortCode or /l/{shortCode} URL.' });
      return;
    }

    this.openLoading.set(true);
    this.openError.set(null);

    this.linksApi
      .openSecureLink(shortCode)
      .pipe(finalize(() => this.openLoading.set(false)))
      .subscribe({
        next: () => window.open(`/l/${shortCode}`, '_blank', 'noopener'),
        error: (error: ApiError) => {
          if (error.status === 401) {
            this.passwordRetryError.set('');
            this.passwordModalOpen.set(true);
            return;
          }

          this.openError.set(error);
        }
      });
  }

  retryWithPassword(): void {
    const shortCode = this.extractShortCode(this.helperForm.controls.resource.value.trim());
    if (!shortCode || !this.passwordForm.valid) {
      return;
    }

    this.openLoading.set(true);
    this.linksApi
      .openSecureLink(shortCode, this.passwordForm.controls.password.value)
      .pipe(finalize(() => this.openLoading.set(false)))
      .subscribe({
        next: () => {
          this.passwordModalOpen.set(false);
          this.passwordForm.reset();
          this.passwordRetryError.set('');
          this.showRetryPassword.set(false);
          window.open(`/l/${shortCode}`, '_blank', 'noopener');
        },
        error: (error: ApiError) => {
          if (error.status === 401) {
            this.passwordRetryError.set('Invalid password. Try again.');
            return;
          }

          this.passwordModalOpen.set(false);
          this.openError.set(error);
        }
      });
  }


  startRevealPassword(field: 'create' | 'retry'): void {
    if (field === 'create') {
      this.showCreatePassword.set(true);
      return;
    }

    this.showRetryPassword.set(true);
  }

  stopRevealPassword(field: 'create' | 'retry'): void {
    if (field === 'create') {
      this.showCreatePassword.set(false);
      return;
    }

    this.showRetryPassword.set(false);
  }

  closePasswordModal(): void {
    this.passwordModalOpen.set(false);
    this.passwordRetryError.set('');
    this.passwordForm.reset();
    this.showRetryPassword.set(false);
  }

  revoke(): void {
    const shortCode = this.revokeForm.controls.shortCode.value.trim();
    if (!shortCode || !window.confirm(`Revoke link ${shortCode}? This cannot be undone.`)) {
      return;
    }

    this.revokeLoading.set(true);
    this.revokeFeedback.set(null);

    this.linksApi
      .revokeLink(shortCode)
      .pipe(finalize(() => this.revokeLoading.set(false)))
      .subscribe({
        next: () => {
          this.revokeFeedback.set({ kind: 'success', message: 'Link revoked successfully.' });
          this.revokeForm.reset();
        },
        error: (error: ApiError) => {
          this.revokeFeedback.set({
            kind: 'error',
            message: error.status === 404 ? 'ShortCode not found.' : error.message
          });
        }
      });
  }

  private setFile(file: File | null): void {
    this.chosenFile.set(file);
    if (file) {
      this.form.controls.targetUrl.setValue('');
      this.toastService.show({ kind: 'info', title: 'Arquivo pronto', message: file.name }, 2500);
    }
  }

  private extractShortCode(value: string): string {
    if (!value) {
      return '';
    }

    if (/^[A-Za-z0-9_-]{4,}$/.test(value)) {
      return value;
    }

    try {
      const parsed = new URL(value);
      return parsed.pathname.match(/\/l\/([A-Za-z0-9_-]+)/)?.[1] ?? '';
    } catch {
      return '';
    }
  }

  private toExpiresAt(durationValue: number, durationUnit: DurationUnit): string {
    const multipliers: Record<DurationUnit, number> = {
      seconds: 1000,
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000
    };

    return new Date(Date.now() + durationValue * multipliers[durationUnit]).toISOString();
  }
}
