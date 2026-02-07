import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import api from '../../services/api';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

// Mock api
vi.mock('../../services/api', () => ({
    default: {
        post: vi.fn(),
    }
}));

// Mock Contexts
const mockLogin = vi.fn();
const mockRefreshPermissions = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin
    })
}));

vi.mock('../../context/PermissionContext', () => ({
    usePermissions: () => ({
        refreshPermissions: mockRefreshPermissions
    })
}));

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form correctly', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login Now/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const submitBtn = screen.getByRole('button', { name: /Login Now/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
        // Depends on logic, usually it might stop at first error or show both.
        // Looking at code:
        // ... if (!email.trim()) hasError = true
        // ... if (!password.trim()) hasError = true
        // So both errors should appear if logic flows through.
        expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        // Mock successful API response
        api.post.mockResolvedValueOnce({
            data: {
                message: 'Login successful',
                data: {
                    token: 'fake-token',
                    user: { email: 'test@example.com', full_name: 'Test User', Roles: [{ name: 'admin' }] }
                }
            }
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

        // Check values updated
        expect(screen.getByLabelText(/Email Address/i).value).toBe('test@example.com');
        expect(screen.getByLabelText(/Password/i).value).toBe('password123');

        const submitBtn = screen.getByRole('button', { name: /Login Now/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });
        });

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
        });
    });

    it('handles login failure', async () => {
        // Mock failed API response
        const errorMessage = 'Invalid credentials';
        api.post.mockRejectedValueOnce({
            response: {
                data: {
                    message: errorMessage
                }
            }
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Login Now/i }));

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });
});
