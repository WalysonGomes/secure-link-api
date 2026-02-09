import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppError, LinkResponse } from '../../shared/models/api.models';
import { OpenLinkResult, SecureLinkApiService } from '../../core/api/secure-link-api.service';

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

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile = file;
    if (file) this.targetUrl = '';
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
    const password = this.password.trim() || undefined;

    const request$ =
      this.mode === 'file' && this.selectedFile
        ? this.api.uploadLink({ file: this.selectedFile, expiresAt, maxViews, password })
        : this.api.createLink({ targetUrl: this.targetUrl.trim(), expiresAt, maxViews, password });

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
      this.errorMessage = 'Enter a valid shortCode or /l/{shortCode} URL.';
      return;
    }

    this.openShortCode = shortCode;
    this.openLoading = true;
    this.errorMessage = '';

    this.api.openLink(shortCode).subscribe({
      next: (result) => {
        this.handleOpenResult(result);
        this.openLoading = false;
      },
      error: (error: AppError) => {
        this.openLoading = false;
        if (error.status === 401) {
          this.showPasswordModal = true;
          return;
        }
        this.errorMessage = this.toErrorMessage(error);
      }
    });
  }

  retryWithPassword(): void {
    this.openLoading = true;
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
        this.errorMessage = this.toErrorMessage(error);
      }
    });
  }

  revoke(): void {
    const shortCode = this.extractShortCode(this.revokeCode);
    if (!shortCode) {
      this.errorMessage = 'Enter a valid shortCode to revoke.';
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
      this.errorMessage = 'Could not process file response.';
      return;
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename ?? 'download';
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

  private toErrorMessage(error: AppError): string {
    return error.errorId ? `${error.message} (errorId: ${error.errorId})` : error.message;
  }
}
