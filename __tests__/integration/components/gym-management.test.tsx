/**
 * Integration Tests for Gym Management Page
 * Tests gym CRUD operations within an organization
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { gymsApi, organizationsApi } from '@/api/api-clients-with-gyms'

// Mock the APIs
jest.mock('@/api/api-clients-with-gyms')

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({
      uid: 'test-user',
      email: 'test@example.com',
    })
    return jest.fn()
  }),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'org-123' }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Gym Management Integration Tests', () => {
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Fitness Organization',
    email: 'org@example.com',
  }

  const mockGyms = [
    {
      gymId: 'FIT-GYM-001',
      id: 'FIT-GYM-001',
      name: 'Downtown Gym',
      address: '123 Main St',
      phone: '555-1111',
      email: 'downtown@gym.com',
      capacity: 200,
      manager: 'John Manager',
      status: 'ACTIVE',
      organizationId: 'org-123',
      openingTime: '06:00',
      closingTime: '22:00',
    },
    {
      gymId: 'FIT-GYM-002',
      id: 'FIT-GYM-002',
      name: 'Uptown Gym',
      address: '456 Oak Ave',
      phone: '555-2222',
      email: 'uptown@gym.com',
      capacity: 150,
      manager: 'Jane Manager',
      status: 'ACTIVE',
      organizationId: 'org-123',
      openingTime: '05:00',
      closingTime: '23:00',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    ;(organizationsApi.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrganization,
    })

    ;(gymsApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockGyms,
    })
  })

  describe('Gym List Display', () => {
    test('should load and display gyms for organization', async () => {
      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(organizationsApi.getById).toHaveBeenCalledWith('org-123')
        expect(gymsApi.getAll).toHaveBeenCalledWith('org-123')
      })

      expect(screen.getByText(/Test Fitness Organization/i)).toBeInTheDocument()
    })

    test('should display gym details correctly', async () => {
      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
        expect(screen.getByText('Uptown Gym')).toBeInTheDocument()
      })
    })

    test('should handle empty gym list', async () => {
      ;(gymsApi.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText(/no gyms found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Create Gym Flow', () => {
    test('should create gym with auto-generated ID', async () => {
      const newGym = {
        gymId: 'FIT-GYM-003',
        name: 'New Gym',
        address: '789 New St',
        phone: '555-3333',
        email: 'new@gym.com',
        capacity: 175,
        manager: 'New Manager',
        status: 'ACTIVE',
        organizationId: 'org-123',
      }

      ;(gymsApi.create as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: newGym,
      })

      ;(gymsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockGyms })
        .mockResolvedValueOnce({
          success: true,
          data: [...mockGyms, newGym],
        })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      // Click add new gym button
      const addButton = screen.getByRole('button', { name: /add new gym/i })
      fireEvent.click(addButton)

      // Fill form
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/enter gym name/i), 'New Gym')
      await user.type(screen.getByPlaceholderText(/street address/i), '789 New St')
      await user.type(screen.getByPlaceholderText(/gym manager name/i), 'New Manager')
      await user.type(screen.getByPlaceholderText(/phone number/i), '555-3333')

      // Submit
      const createButton = screen.getByRole('button', { name: /create gym/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(gymsApi.create).toHaveBeenCalledWith(
          'org-123',
          expect.objectContaining({
            name: 'New Gym',
            address: '789 New St',
          })
        )
        expect(gymsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    test('should validate required gym fields', async () => {
      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add new gym/i })
      fireEvent.click(addButton)

      // Try to submit without required fields
      const createButton = screen.getByRole('button', { name: /create gym/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/gym name is required/i)).toBeInTheDocument()
      })

      expect(gymsApi.create).not.toHaveBeenCalled()
    })

    test('should handle create errors gracefully', async () => {
      ;(gymsApi.create as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Gym with this name already exists',
      })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add new gym/i })
      fireEvent.click(addButton)

      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText(/enter gym name/i), 'Downtown Gym')
      await user.type(screen.getByPlaceholderText(/street address/i), '123 Main St')
      await user.type(screen.getByPlaceholderText(/gym manager name/i), 'Test')
      await user.type(screen.getByPlaceholderText(/phone number/i), '555-0000')

      const createButton = screen.getByRole('button', { name: /create gym/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(gymsApi.create).toHaveBeenCalled()
      })
    })
  })

  describe('Update Gym Flow', () => {
    test('should update gym and refresh list', async () => {
      const updatedGym = {
        ...mockGyms[0],
        name: 'Updated Downtown Gym',
        capacity: 250,
      }

      ;(gymsApi.update as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: updatedGym,
      })

      ;(gymsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockGyms })
        .mockResolvedValueOnce({
          success: true,
          data: [updatedGym, mockGyms[1]],
        })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      // Click edit button for first gym
      const editButtons = screen.getAllByTitle(/edit/i)
      fireEvent.click(editButtons[0])

      // Update name
      const nameInput = screen.getByDisplayValue('Downtown Gym')
      const user = userEvent.setup()
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Downtown Gym')

      const updateButton = screen.getByRole('button', { name: /update/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(gymsApi.update).toHaveBeenCalledWith(
          'FIT-GYM-001',
          expect.objectContaining({
            name: 'Updated Downtown Gym',
          })
        )
        expect(gymsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    test('should handle update errors', async () => {
      ;(gymsApi.update as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Unauthorized to update gym',
      })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle(/edit/i)
      fireEvent.click(editButtons[0])

      const updateButton = screen.getByRole('button', { name: /update/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(gymsApi.update).toHaveBeenCalled()
      })
    })
  })

  describe('Delete Gym Flow', () => {
    test('should delete gym and refresh list', async () => {
      ;(gymsApi.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { success: true },
      })

      ;(gymsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockGyms })
        .mockResolvedValueOnce({
          success: true,
          data: [mockGyms[1]], // Only second gym remains
        })

      global.confirm = jest.fn(() => true)

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/delete/i)
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(gymsApi.delete).toHaveBeenCalledWith('FIT-GYM-001')
        expect(gymsApi.getAll).toHaveBeenCalledTimes(2)
      })
    })

    test('should cancel delete on user decline', async () => {
      global.confirm = jest.fn(() => false)

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/delete/i)
      fireEvent.click(deleteButtons[0])

      expect(gymsApi.delete).not.toHaveBeenCalled()
    })
  })

  describe('Search and Filter Gyms', () => {
    test('should filter gyms by name', async () => {
      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
        expect(screen.getByText('Uptown Gym')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search gyms/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'Downtown')

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
        expect(screen.queryByText('Uptown Gym')).not.toBeInTheDocument()
      })
    })

    test('should filter by gym ID', async () => {
      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search gyms/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'FIT-GYM-001')

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
        expect(screen.queryByText('Uptown Gym')).not.toBeInTheDocument()
      })
    })
  })

  describe('Gym Status Management', () => {
    test('should update gym status', async () => {
      const updatedGym = {
        ...mockGyms[0],
        status: 'MAINTENANCE',
      }

      ;(gymsApi.update as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: updatedGym,
      })

      ;(gymsApi.getAll as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockGyms })
        .mockResolvedValueOnce({
          success: true,
          data: [updatedGym, mockGyms[1]],
        })

      const GymPage = require('@/app/organizations/[slug]/page').default
      render(<GymPage />)

      await waitFor(() => {
        expect(screen.getByText('Downtown Gym')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle(/edit/i)
      fireEvent.click(editButtons[0])

      const statusSelect = screen.getByDisplayValue('ACTIVE')
      fireEvent.change(statusSelect, { target: { value: 'MAINTENANCE' } })

      const updateButton = screen.getByRole('button', { name: /update/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(gymsApi.update).toHaveBeenCalledWith(
          'FIT-GYM-001',
          expect.objectContaining({
            status: 'MAINTENANCE',
          })
        )
      })
    })
  })
})
