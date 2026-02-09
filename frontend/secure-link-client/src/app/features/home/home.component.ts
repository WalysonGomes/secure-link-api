import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { LinksApiService } from '../../core/api/links-api.service';
import { ApiError } from '../../models/api-error.models';
import { CreateLinkResponse } from '../../models/link.models';
import { OpenSecureLinkComponent } from '../../shared/ui/open-secure-link.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, OpenSecureLinkComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  targetUrl = '';
  selectedFile: File | null = null;
  durationValue: number | null = 60;
  durationUnit: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes';
  maxViews: number | null = null;
  password = '';
  showAdvanced = false;
  loading = false;
  feedback = '';
  createdLink: CreateLinkResponse | null = null;

  revokeCode = '';
  revokeFeedback = '';

  constructor(private readonly linksApi: LinksApiService) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile) {
      this.targetUrl = '';
    }
  }

  isUrlMode(): boolean {
    return !!this.targetUrl.trim();
  }

  isFileMode(): boolean {
    return this.selectedFile !== null;
  }

  submit(): void {
    this.feedback = '';
    this.createdLink = null;

    if (!this.isUrlMode() && !this.isFileMode()) {
      this.feedback = 'Provide a target URL or select a file.';
      return;
    }

    this.loading = true;

    if (this.isUrlMode()) {
      this.linksApi
        .createLink({
          targetUrl: this.targetUrl.trim(),
          expiresAt: this.getExpiresAtIso(),
          maxViews: this.maxViews ?? undefined,
          password: this.password || undefined
        })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (result) => (this.createdLink = result),
          error: (error: ApiError) => this.handleApiError(error)
        });
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile as Blob);
    const expiresAt = this.getExpiresAtIso();
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }
    if (this.maxViews) {
      formData.append('maxViews', `${this.maxViews}`);
    }
    if (this.password) {
      formData.append('password', this.password);
    }

    this.linksApi
      .uploadLink(formData)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => (this.createdLink = result),
        error: (error: ApiError) => this.handleApiError(error)
      });
  }

  copyLink(): void {
    if (!this.createdLink?.accessUrl) {
      return;
    }

    navigator.clipboard.writeText(this.createdLink.accessUrl);
    this.feedback = 'Link copied to clipboard.';
  }

  revoke(): void {
    const code = this.revokeCode.trim();
    if (!code) {
      this.revokeFeedback = 'Provide a shortCode.';
      return;
    }

    this.revokeFeedback = '';
    this.linksApi.revokeLink(code).subscribe({
      next: () => (this.revokeFeedback = 'Link revoked successfully.'),
      error: (error: ApiError) => {
        this.revokeFeedback =
          error.status === 404
            ? 'Link not found.'
            : error.errorId
              ? `${error.message} (errorId: ${error.errorId})`
              : error.message;
      }
    });
  }

  private getExpiresAtIso(): string | undefined {
    if (!this.durationValue || this.durationValue <= 0) {
      return undefined;
    }

    const now = new Date();
    const multiplier =
      this.durationUnit === 'seconds'
        ? 1000
        : this.durationUnit === 'minutes'
          ? 60_000
          : this.durationUnit === 'hours'
            ? 3_600_000
            : 86_400_000;

    return new Date(now.getTime() + this.durationValue * multiplier).toISOString();
  }

  private handleApiError(error: ApiError): void {
    this.feedback = error.errorId ? `${error.message} (errorId: ${error.errorId})` : error.message;
  }
}
