import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiStatusService } from './core/services/api-status.service';
import { ToastOutletComponent } from './shared/ui/toast-outlet.component';

type Theme = 'dark' | 'light';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastOutletComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  private readonly apiStatus = inject(ApiStatusService);
  readonly isApiOnline = this.apiStatus.online;

  readonly currentTheme = signal<Theme>((localStorage.getItem('secure-link-theme') as Theme) || 'dark');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  readonly isDarkTheme = computed(() => this.currentTheme() === 'dark');

  toggleTheme(): void {
    const nextTheme: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.currentTheme.set(nextTheme);
    localStorage.setItem('secure-link-theme', nextTheme);
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

