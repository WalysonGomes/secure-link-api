import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OpenLinkResult, SecureLinkApiService } from '../../core/api/secure-link-api.service';
import { AppError, LinkResponse } from '../../shared/models/api.models';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  targetUrl = '';
  selectedFile: File | null = null;

  expirationValue: number | null = null;
  expirationUnit: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes';
  maxViews: number | null = null;
  password = '';

  openLinkInput = '';
  openPassword = '';
  openShortCode = '';
  showPasswordModal = false;
  openModalMessage = '';

  revokeCode = '';

  createdLink: LinkResponse | null = null;
  errorMessage = '';
  loading = false;
  openLoading = false;

  constructor(private readonly api: SecureLinkApiService) {}

  get mode(): 'url' | 'file' | 'empty' {
    if (this.selectedFile) return 'file';
    if (this.targetUrl.trim().length > 0) return 'url';

    return 'empty';
  }

  get formReady(): boolean {
    return this.mode === 'file' || (this.mode === 'url' && this.targetUrl.trim().length > 0);
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile = file;
    if (file) {
      this.targetUrl = '';
      this.errorMessage = '';
    }
  }

  clearFile(): void {
    this.selectedFile = null;
  }

  submit(): void {
    this.errorMessage = '';
    this.createdLink = null;
    this.loading = true;

    const expiresAt = this.buildExpiresAt();
    const maxViews = this.maxViews ?? undefined;
    const formPassword = this.password.trim() || undefined;

    const request$ =
      this.mode === 'file' && this.selectedFile
        ? this.api.uploadLink({ file: this.selectedFile, expiresAt, maxViews, password: formPassword })
        : this.api.createLink({
            targetUrl: this.targetUrl.trim(),
            expiresAt,
            maxViews,
            password: formPassword
          });

    request$.subscribe({
      next: (response) => {
        this.createdLink = response;
        this.loading = false;
      },
      error: (error: AppError) => {
        this.errorMessage = this.toErrorMessage(error);
        this.loading = false;
      }
    });
  }

  copyAccessUrl(): void {
    if (!this.createdLink?.accessUrl) return;
    navigator.clipboard.writeText(this.createdLink.accessUrl);
  }

  openAccessUrl(): void {
    if (!this.createdLink?.accessUrl) return;
    window.open(this.createdLink.accessUrl, '_blank', 'noopener,noreferrer');
  }

  tryOpenSecureLink(): void {
    const shortCode = this.extractShortCode(this.openLinkInput);
    if (!shortCode) {
      this.errorMessage = 'Use um shortCode válido ou URL no formato /l/{shortCode}.';
      return;
    }

    this.openShortCode = shortCode;
    this.openLoading = true;
    this.openModalMessage = '';
    this.errorMessage = '';

    this.api.openLink(shortCode).subscribe({
      next: (result) => {
        this.handleOpenResult(result);
        this.openLoading = false;
      },
      error: (error: AppError) => {
        this.openLoading = false;
        if (error.status === 401 && this.isPasswordRequired(error.message)) {
          this.showPasswordModal = true;
          this.openModalMessage = 'Senha obrigatória para abrir este link.';
          return;
        }

        this.errorMessage = this.toOpenErrorMessage(error);
      }
    });
  }

  retryWithPassword(): void {
    this.openLoading = true;
    this.openModalMessage = '';
    this.errorMessage = '';

    this.api.openLink(this.openShortCode, this.openPassword).subscribe({
      next: (result) => {
        this.handleOpenResult(result);
        this.showPasswordModal = false;
        this.openPassword = '';
        this.openLoading = false;
      },
      error: (error: AppError) => {
        this.openLoading = false;
        if (error.status === 401 && this.isInvalidPassword(error.message)) {
          this.showPasswordModal = true;
          this.openModalMessage = 'Senha inválida. Tente novamente.';
          return;
        }

        this.showPasswordModal = false;
        this.errorMessage = this.toOpenErrorMessage(error);
      }
    });
  }

  revoke(): void {
    const shortCode = this.extractShortCode(this.revokeCode);
    if (!shortCode) {
      this.errorMessage = 'Informe um shortCode válido para revogar.';
      return;
    }

    if (!window.confirm(`Revoke link ${shortCode}?`)) return;

    this.api.revokeLink(shortCode).subscribe({
      next: () => {
        this.errorMessage = '';
        this.revokeCode = '';
      },
      error: (error: AppError) => {
        this.errorMessage = this.toErrorMessage(error);
      }
    });
  }

  private handleOpenResult(result: OpenLinkResult): void {
    if (result.kind === 'url') {
      window.open(result.finalUrl ?? `/l/${this.openShortCode}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!result.blob) {
      this.errorMessage = 'Não foi possível processar o download do arquivo.';
      return;
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename ?? 'secure-link-download';
    link.click();
    URL.revokeObjectURL(url);
  }

  private extractShortCode(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (!trimmed.includes('/')) return trimmed;

    const match = trimmed.match(/\/l\/([A-Za-z0-9_-]+)/);

    return match?.[1] ?? '';
  }

  private buildExpiresAt(): string | undefined {
    if (!this.expirationValue || this.expirationValue <= 0) return undefined;

    const now = new Date();
    const multipliers = {
      seconds: 1000,
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000
    };

    return new Date(now.getTime() + this.expirationValue * multipliers[this.expirationUnit]).toISOString();
  }

  private isPasswordRequired(message: string): boolean {
    return message.toLowerCase().includes('password required');
  }

  private isInvalidPassword(message: string): boolean {
    return message.toLowerCase().includes('invalid password');
  }

  private toOpenErrorMessage(error: AppError): string {
    if (error.status === 404) return 'Link não encontrado.';
    if (error.status === 410) return 'Link expirado, revogado ou limite de visualizações atingido.';

    return this.toErrorMessage(error);
  }

  private toErrorMessage(error: AppError): string {
    return error.errorId ? `${error.message} (errorId: ${error.errorId})` : error.message;
  }
}
