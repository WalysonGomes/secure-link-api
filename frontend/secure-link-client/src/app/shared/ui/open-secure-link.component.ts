import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LinksApiService } from '../../core/api/links-api.service';
import { ApiError } from '../../models/api-error.models';

@Component({
  selector: 'app-open-secure-link',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './open-secure-link.component.html'
})
export class OpenSecureLinkComponent {
  linkInput = '';
  password = '';
  passwordModalOpen = false;
  errorMessage = '';
  loading = false;
  pendingCode = '';

  constructor(private readonly linksApi: LinksApiService) {}

  open(): void {
    const shortCode = this.extractShortCode(this.linkInput);
    if (!shortCode) {
      this.errorMessage = 'Provide a shortCode or complete /l/{shortCode} URL.';
      return;
    }

    this.pendingCode = shortCode;
    this.tryOpen(shortCode);
  }

  retryWithPassword(): void {
    if (!this.password) {
      this.errorMessage = 'Password is required.';
      return;
    }

    this.tryOpen(this.pendingCode, this.password);
  }

  private tryOpen(shortCode: string, password?: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.linksApi.openSecureLink(shortCode, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.passwordModalOpen = false;

        if (response.status === 200 && response.body) {
          const blobUrl = URL.createObjectURL(response.body);
          window.open(blobUrl, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          return;
        }

        window.open(this.linksApi.getPublicAccessUrl(shortCode), '_blank', 'noopener');
      },
      error: (error: ApiError) => {
        this.loading = false;

        if (error.status === 401) {
          this.passwordModalOpen = true;
          this.errorMessage = error.message;
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Link not found.';
          return;
        }

        if (error.status === 410) {
          this.errorMessage = 'Link unavailable (expired, revoked or max views reached).';
          return;
        }

        this.errorMessage = error.errorId
          ? `${error.message} (errorId: ${error.errorId})`
          : error.message;
      }
    });
  }

  private extractShortCode(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!trimmed.includes('/')) {
      return trimmed;
    }

    const match = trimmed.match(/\/l\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }
}
