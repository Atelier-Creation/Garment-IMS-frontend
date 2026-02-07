import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';
import { reportService } from '../../services';

// Mock dependencies
vi.mock('../../services', () => ({
    reportService: {
        getDashboardStats: vi.fn(),
    }
}));

// Mock ResizeObserver for Recharts or other responsive components
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    const mockDashboardData = {
        success: true,
        data: {
            production: { completed_orders: 120, total_produced: 5000 },
            sales: { this_month: { count: 45, total: 150000 } },
            alerts: { low_stock_items: 5 },
            pending_orders: { sales: 2, purchase: 1, production: 3 },
            charts: {
                sales_by_status: [{ status: 'CONFIRMED', count: 10 }],
                production_by_status: [{ status: 'completed', count: 5 }],
                stock_levels: [{ stock_level: 'Low', count: 5 }],
                monthly_sales_trend: [{ month: '2026-01', revenue: 150000 }],
                top_products: [{ product_name: 'Test Product', size: 'M', color: 'Blue', total_sold: 20 }]
            },
            recent_activities: [
                { type: 'sales', activity: 'New Order #123', reference: 'ORD-123', created_at: '2026-01-20T10:00:00Z' }
            ]
        }
    };

    it('renders dashboard title based on role', async () => {
        localStorage.setItem('role', 'Super Admin');
        reportService.getDashboardStats.mockResolvedValue(mockDashboardData);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for title to update
        expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('fetches and displays dashboard stats', async () => {
        reportService.getDashboardStats.mockResolvedValue(mockDashboardData);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Wait for data to load
        expect(await screen.findByText(/Completed Production/i)).toBeInTheDocument();

        // Check values using findByText for async wait
        expect(await screen.findByText('120')).toBeInTheDocument();
        expect(await screen.findByText(/This Month Orders/i)).toBeInTheDocument();
        expect(await screen.findByText('45')).toBeInTheDocument();

        // Revenue formatting check - flexible regex
        expect(await screen.findByText(/150,000|1,50,000/)).toBeInTheDocument();

        expect(await screen.findByText(/Low Stock Items/i)).toBeInTheDocument();
        expect(await screen.findByText('5')).toBeInTheDocument();
    });

    it('renders quick stats links', async () => {
        reportService.getDashboardStats.mockResolvedValue(mockDashboardData);
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(await screen.findByText('Pending Sales')).toBeInTheDocument();
    });

    it('handles API error gracefully', async () => {
        reportService.getDashboardStats.mockRejectedValue(new Error('Network error'));

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Should render fallback data "Completed Production"
        expect(await screen.findByText(/Completed Production/i)).toBeInTheDocument();
    });
});
