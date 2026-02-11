import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { LinksApiService } from '../../core/api/links-api.service';
import { API_BASE_URL } from '../../core/config/api.config';
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
  private readonly apiBaseUrl = inject(API_BASE_URL);

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
  readonly openRequiresPassword = signal(false);
  readonly openPasswordOptionEnabled = signal(false);
  readonly passwordRetryError = signal('');

  readonly showCreatePassword = signal(false);

  readonly revokeLoading = signal(false);
  readonly revokeFeedback = signal<{ kind: 'success' | 'error'; message: string } | null>(null);
  readonly showRevokeConfirm = signal(false);
  readonly pendingRevokeCode = signal('');

  readonly form = this.fb.nonNullable.group({
    targetUrl: ['', [Validators.pattern(/^https?:\/\/.+/i)]],
    durationValue: [null as number | null, [Validators.min(1), Validators.max(3650)]],
    durationUnit: ['hours' as DurationUnit],
    maxViews: [null as number | null, [Validators.min(1), Validators.max(100)]],
    password: ['']
  });

  readonly helperForm = this.fb.nonNullable.group({
    resource: [''],
    password: ['']
  });

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

    return this.isSubmitting() ||
      (mode === 'url'
        ? this.form.controls.targetUrl.invalid
        : mode === 'file'
          ? !this.chosenFile()
          : true);
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.apiError.set(null);
    this.openError.set(null);
    this.revokeFeedback.set(null);

    if (tab !== 'open') {
      this.openPasswordOptionEnabled.set(false);
      this.passwordRetryError.set('');
    }
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

    if (field === 'durationValue' && digits === '') {
      this.form.controls.durationValue.setValue(null);
      input.value = '';
      return;
    }

    const value = String(Number(digits));
    input.value = value;

    if (field === 'durationValue') {
      this.form.controls.durationValue.setValue(Number(value));
      return;
    }

    this.form.controls.maxViews.setValue(Number(value));
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

  shouldShowOpenPasswordField(): boolean {
    return this.openRequiresPassword() || this.openPasswordOptionEnabled();
  }

  onOpenPasswordToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toggleOpenPasswordOption(input.checked);
  }

  toggleOpenPasswordOption(enabled: boolean): void {
    this.openPasswordOptionEnabled.set(enabled);
    if (!enabled && !this.openRequiresPassword()) {
      this.helperForm.controls.password.setValue('');
      this.passwordRetryError.set('');
    }
  }


  durationUnitLabel(unit: DurationUnit): string {
    const labels: Record<DurationUnit, string> = {
      seconds: 'segundos',
      minutes: 'minutos',
      hours: 'horas',
      days: 'dias'
    };

    return labels[unit];
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
          this.resetCreateForm();
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
    const rawPassword = this.helperForm.controls.password.value.trim();
    const shouldSendPassword = this.shouldShowOpenPasswordField();
    const password = shouldSendPassword ? rawPassword || undefined : undefined;

    if (!shortCode) {
      const error = { status: 400, message: 'Informe um shortCode ou URL válida /l/{shortCode}.' } as ApiError;
      this.openError.set(error);
      this.toastService.show({ kind: 'warning', title: 'Entrada inválida', message: error.message });
      return;
    }

    if (this.openRequiresPassword() && !password) {
      this.passwordRetryError.set('Digite a senha para acessar este link protegido.');
      return;
    }

    this.openLoading.set(true);
    this.openError.set(null);

    this.linksApi
      .openSecureLink(shortCode, password)
      .pipe(finalize(() => this.openLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.openRequiresPassword.set(false);
          this.passwordRetryError.set('');
          this.clearOpenFields();

          if (password) {
            this.handleProtectedResolution(response, shortCode);
            return;
          }

          this.openInNewTab(this.resolveBackendLinkUrl(shortCode));
        },
        error: (error: ApiError) => {
          if (error.status === 401) {
            this.openRequiresPassword.set(true);
            this.openPasswordOptionEnabled.set(true);
            this.passwordRetryError.set(
              password
                ? 'Senha inválida. Confira e tente novamente.'
                : 'Este link exige senha. Digite a senha para continuar.'
            );
            return;
          }

          if (error.status === 0) {
            if (password) {
              const message = 'Senha aceita, mas o destino externo bloqueou CORS para XHR. Abra pelo backend ou ajuste o destino para permitir redirecionamento.';
              this.passwordRetryError.set(message);
              this.toastService.show({ kind: 'warning', title: 'Redirecionamento bloqueado', message });
              return;
            }

            this.openRequiresPassword.set(false);
            this.passwordRetryError.set('');
            this.openInNewTab(this.resolveBackendLinkUrl(shortCode));
            return;
          }

          this.openError.set(error);
          this.toastService.show({ kind: 'error', title: `Erro HTTP ${error.status || 0}`, message: error.message });
        }
      });
  }

  startRevealPassword(): void {
    this.showCreatePassword.set(true);
  }

  stopRevealPassword(): void {
    this.showCreatePassword.set(false);
  }

  revoke(): void {
    const rawValue = this.revokeForm.controls.shortCode.value.trim();
    const shortCode = this.extractShortCode(rawValue);

    if (!shortCode) {
      this.revokeFeedback.set({
        kind: 'error',
        message: 'Informe um shortCode válido ou URL completa.'
      });
      return;
    }

    this.pendingRevokeCode.set(shortCode);
    this.showRevokeConfirm.set(true);
  }

  cancelRevoke(): void {
    this.showRevokeConfirm.set(false);
    this.pendingRevokeCode.set('');
  }

  confirmRevoke(): void {
    const shortCode = this.pendingRevokeCode();
    if (!shortCode) {
      return;
    }

    this.revokeLoading.set(true);
    this.revokeFeedback.set(null);

    this.linksApi
      .revokeLink(shortCode)
      .pipe(finalize(() => this.revokeLoading.set(false)))
      .subscribe({
        next: () => {
          this.revokeFeedback.set({ kind: 'success', message: 'Link revogado com sucesso.' });
          this.revokeForm.reset();
          this.cancelRevoke();
        },
        error: (error: ApiError) => {
          this.revokeFeedback.set({
            kind: 'error',
            message: error.status === 404 ? 'ShortCode não encontrado.' : error.message
          });
        }
      });
  }

  private resolveBackendLinkUrl(shortCode: string): string {
    return new URL(`l/${shortCode}`, this.apiBaseUrl).toString();
  }

  private openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  private handleProtectedResolution(response: HttpResponse<Blob>, shortCode: string): void {
    const locationHeader = response.headers.get('Location');
    const responseUrl = response.url ?? '';
    const contentType = (response.headers.get('Content-Type') ?? '').toLowerCase();

    if (locationHeader) {
      this.openInNewTab(new URL(locationHeader, this.apiBaseUrl).toString());
      return;
    }

    if (contentType.includes('application/json') && response.body) {
      response.body
        .text()
        .then((raw) => {
          try {
            const payload = JSON.parse(raw) as { type?: string; targetUrl?: string };
            if (payload.type === 'REDIRECT' && payload.targetUrl) {
              this.openInNewTab(payload.targetUrl);
              return;
            }
          } catch {
            // handled by fallback below
          }

          const error = { status: 400, message: 'Resposta inválida ao resolver link protegido.' } as ApiError;
          this.openError.set(error);
          this.toastService.show({ kind: 'error', title: 'Falha na resolução', message: error.message });
        })
        .catch(() => {
          const error = { status: 400, message: 'Não foi possível processar a resposta de redirecionamento.' } as ApiError;
          this.openError.set(error);
          this.toastService.show({ kind: 'error', title: 'Falha na resolução', message: error.message });
        });
      return;
    }

    if (responseUrl && !responseUrl.endsWith(`/l/${shortCode}`)) {
      this.openInNewTab(responseUrl);
      return;
    }

    const contentDisposition = response.headers.get('Content-Disposition') ?? '';
    if (contentDisposition.toLowerCase().includes('attachment') && response.body) {
      const blobUrl = URL.createObjectURL(response.body);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      const filename = /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1];
      if (filename) {
        anchor.download = filename;
      }

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
      return;
    }

    const error = {
      status: 400,
      message: 'Senha validada, mas o navegador bloqueou a resolução automática do destino.'
    } as ApiError;
    this.openError.set(error);
    this.toastService.show({ kind: 'warning', title: 'Resolução incompleta', message: error.message });
  }

  private clearOpenFields(): void {
    this.helperForm.controls.resource.setValue('');
    this.helperForm.controls.password.setValue('');
  }

  private resetCreateForm(): void {
    this.form.reset({
      targetUrl: '',
      durationValue: null,
      durationUnit: 'hours',
      maxViews: null,
      password: ''
    });
    this.chosenFile.set(null);
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

  private toExpiresAt(durationValue: number | null, durationUnit: DurationUnit): string | undefined {
    if (!durationValue || durationValue < 1) {
      return undefined;
    }

    const multipliers: Record<DurationUnit, number> = {
      seconds: 1000,
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000
    };

    return new Date(Date.now() + durationValue * multipliers[durationUnit]).toISOString();
  }
}
