/**
 * Jest tests for SalaryProgressionSidebar component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalaryProgressionSidebar from '../SalaryProgressionSidebar';

// Mock fetch
global.fetch = jest.fn();

describe('SalaryProgressionSidebar', () => {
  const defaultProps = {
    apiBaseUrl: 'https://api.example.com',
    authToken: 'test-token',
    onClose: jest.fn(),
    onResult: jest.fn(),
    onExportReady: jest.fn()
  };

  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
  });

  test('renders sidebar component', () => {
    render(<SalaryProgressionSidebar {...defaultProps} />);
    expect(screen.getByText('Salary Progression')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<SalaryProgressionSidebar {...defaultProps} />);
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('displays error message on compute failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SalaryProgressionSidebar {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/employee data/i);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ employee_id: 'E1', appointment_date: '2000-01-01', current_grade: '12', current_step: 1 }]) }
    });

    const computeButton = screen.getByText('Compute');
    fireEvent.click(computeButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('calls API with correct payload on compute', async () => {
    const mockResults = {
      status: 'ok',
      results: [
        {
          employee_id: 'E1',
          computed_grade: '12',
          computed_step: 2,
          basic_salary: 100000
        }
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults
    });

    render(<SalaryProgressionSidebar {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/employee data/i);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ employee_id: 'E1', appointment_date: '2000-01-01', current_grade: '12', current_step: 1 }]) }
    });

    const computeButton = screen.getByText('Compute');
    fireEvent.click(computeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/compute',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'X-API-Key': 'test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  test('disables buttons when loading', async () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SalaryProgressionSidebar {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/employee data/i);
    fireEvent.change(textarea, {
      target: { value: JSON.stringify([{ employee_id: 'E1', appointment_date: '2000-01-01', current_grade: '12', current_step: 1 }]) }
    });

    const computeButton = screen.getByText('Compute');
    fireEvent.click(computeButton);

    await waitFor(() => {
      expect(screen.getByText('Computing...')).toBeInTheDocument();
    });
  });
});

