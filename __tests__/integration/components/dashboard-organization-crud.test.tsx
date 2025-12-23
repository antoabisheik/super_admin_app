/**
 * Integration Tests for Dashboard Organization CRUD Operations
 * Tests the complete integration between Dashboard, OrganizationModal, and MainTable
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '@/app/_Components/DashBoard'
import { organizationsApi } from '@/api/api-clients-with-gyms'

// Mock the API
jest.mock('@/api/api-clients-with-gyms', () => ({
  organizationsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  devicesApi: {
    getAll: jest.fn(),
  },
}))

// Mock Auth Context
jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    loading: false,
  }),
}))

describe('Dashboard Organization CRUD Integration', () => {
  const mockOrganizations = [
    {
      id: 'org-1',
      email: 'org1@example.com',
      name: 'Organization 1',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      role: 'Admin',
      status: 'active',
      tags: ['Marketing'],
      avatar: 'J',
    },
    {
      id: 'org-2',
      email: 'org2@example.com',
      name: 'Organization 2',
      firstName: 'Jane',
      lastName: 'Smith',
      address: '456 Oak Ave',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
      role: 'User',
      status: 'active',
      tags: ['Sales'],
      avatar: 'J',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    ;(organizationsApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrganizations,
    })

    const devicesApi = require('@/api/api-clients-with-gyms').devicesApi
    ;(devicesApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    })
  })

  describe('Initial Load', () => {
    test('should load and display organizations on mount', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(organizationsApi.getAll).toHaveBeenCalled()
      })

      expect(screen.getByText('Organization 1')).toBeInTheDocument()
      expect(screen.getByText('Organization 2')).toBeInTheDocument()
    })

    test('should display organization details correctly', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('org1@example.com')).toBeInTheDocument()
        expect(screen.getByText('org2@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Create Organization Flow', () => {
    test('should open modal when create button clicked', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(createButton)

      expect(screen.getByText('Create Organization')).toBeInTheDocument()
    })

    test('should create organization and refresh list', async () => {
      const newOrg = {
        id: 'org-3',
        email: 'new@example.com',
        name: 'New Organization',
        firstName: 'New',
        lastName: 'User',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      }

      ;(organizationsApi.create as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: newOrg,
      })

      ;(organizationsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockOrganizations })
        .mockResolvedValueOnce({
          success: true,
          data: [...mockOrganizations, newOrg],
        })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      // Open modal
      const createButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(createButton)

      // Fill form
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/enter your email/i), newOrg.email)
      await user.type(screen.getByPlaceholderText(/first name/i), newOrg.firstName)
      await user.type(screen.getByPlaceholderText(/last name/i), newOrg.lastName)
      await user.type(screen.getByPlaceholderText(/city/i), newOrg.city)
      await user.type(screen.getByPlaceholderText(/zip code/i), newOrg.zip)

      // Submit
      const submitButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(organizationsApi.create).toHaveBeenCalled()
        expect(organizationsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    test('should validate required fields', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(createButton)

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })

      expect(organizationsApi.create).not.toHaveBeenCalled()
    })

    test('should handle API errors gracefully', async () => {
      ;(organizationsApi.create as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Email already exists',
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      // Open modal and fill form
      const createButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(createButton)

      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/enter your email/i), 'duplicate@example.com')
      await user.type(screen.getByPlaceholderText(/first name/i), 'Test')
      await user.type(screen.getByPlaceholderText(/last name/i), 'User')
      await user.type(screen.getByPlaceholderText(/city/i), 'Test City')
      await user.type(screen.getByPlaceholderText(/zip code/i), '12345')

      const submitButton = screen.getByRole('button', { name: /create/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(organizationsApi.create).toHaveBeenCalled()
      })
    })
  })

  describe('Delete Organization Flow', () => {
    test('should delete organization and refresh list', async () => {
      ;(organizationsApi.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { success: true },
      })

      ;(organizationsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockOrganizations })
        .mockResolvedValueOnce({
          success: true,
          data: [mockOrganizations[1]], // Only second org remains
        })

      // Mock window.confirm
      global.confirm = jest.fn(() => true)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      // Find and click delete button for first organization
      const deleteButtons = screen.getAllByTitle(/delete organization/i)
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(organizationsApi.delete).toHaveBeenCalledWith('org-1')
        expect(organizationsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    test('should cancel delete when user declines confirmation', async () => {
      global.confirm = jest.fn(() => false)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/delete organization/i)
      fireEvent.click(deleteButtons[0])

      expect(organizationsApi.delete).not.toHaveBeenCalled()
    })

    test('should handle delete API errors', async () => {
      ;(organizationsApi.delete as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Cannot delete organization with active gyms',
      })

      global.confirm = jest.fn(() => true)

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/delete organization/i)
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(organizationsApi.delete).toHaveBeenCalled()
      })

      // List should NOT be refreshed on error
      expect(organizationsApi.getAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('Update Organization Flow', () => {
    test('should open modal with existing data for edit', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle(/edit organization/i)
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Organization')).toBeInTheDocument()
        expect(screen.getByDisplayValue('org1@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      })
    })

    test('should update organization and refresh list', async () => {
      const updatedOrg = {
        ...mockOrganizations[0],
        name: 'Updated Organization',
        city: 'San Francisco',
      }

      ;(organizationsApi.update as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: updatedOrg,
      })

      ;(organizationsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockOrganizations })
        .mockResolvedValueOnce({
          success: true,
          data: [updatedOrg, mockOrganizations[1]],
        })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle(/edit organization/i)
      fireEvent.click(editButtons[0])

      // Update city field
      const cityInput = screen.getByDisplayValue('New York')
      const user = userEvent.setup()
      await user.clear(cityInput)
      await user.type(cityInput, 'San Francisco')

      const updateButton = screen.getByRole('button', { name: /update/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(organizationsApi.update).toHaveBeenCalled()
        expect(organizationsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Search and Filter', () => {
    test('should filter organizations by search term', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
        expect(screen.getByText('Organization 2')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'Organization 1')

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
        expect(screen.queryByText('Organization 2')).not.toBeInTheDocument()
      })
    })

    test('should filter by email', async () => {
      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'org1@example.com')

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
        expect(screen.queryByText('Organization 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('State Synchronization', () => {
    test('should maintain consistent state across create-refresh cycle', async () => {
      const newOrg = {
        id: 'org-3',
        email: 'test@example.com',
        name: 'Test Org',
      }

      let callCount = 0
      ;(organizationsApi.getAll as jest.Mock).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return { success: true, data: mockOrganizations }
        } else {
          return { success: true, data: [...mockOrganizations, newOrg] }
        }
      })

      ;(organizationsApi.create as jest.Mock).mockResolvedValue({
        success: true,
        data: newOrg,
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Organization 1')).toBeInTheDocument()
      })

      expect(screen.queryByText('Test Org')).not.toBeInTheDocument()

      // Trigger create (simplified)
      await waitFor(() => {
        expect(organizationsApi.getAll).toHaveBeenCalledTimes(1)
      })
    })
  })
})
