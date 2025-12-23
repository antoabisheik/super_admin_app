/**
 * Integration Tests for Gyms API
 * Tests the hybrid collection model (nested create/list, top-level read/update/delete)
 */

import { gymsApi } from '@/api/api-clients-with-gyms'
import { getAuth } from 'firebase/auth'

global.fetch = jest.fn()

describe('Gyms API Integration Tests', () => {
  const mockGym = {
    gymId: 'FIT-GYM-001',
    id: 'FIT-GYM-001',
    name: 'Downtown Fitness',
    address: '456 Gym St',
    phone: '555-1234',
    email: 'gym@example.com',
    capacity: 200,
    manager: 'Mike Manager',
    status: 'ACTIVE' as const,
    organizationId: 'org-123',
    openingTime: '06:00',
    closingTime: '22:00',
  }

  const mockAuthUser = {
    uid: 'test-user-id',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getAuth as jest.Mock).mockReturnValue({
      currentUser: mockAuthUser,
    })
  })

  describe('GET /organizations/:orgId/gyms - getAll()', () => {
    test('should fetch all gyms for an organization', async () => {
      const mockResponse = {
        success: true,
        data: [mockGym],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await gymsApi.getAll('org-123')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].gymId).toBe('FIT-GYM-001')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123/gyms'),
        expect.any(Object)
      )
    })

    test('should return empty array when organization has no gyms', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      const result = await gymsApi.getAll('org-empty')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    test('should handle organization not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Organization not found' }),
      })

      const result = await gymsApi.getAll('invalid-org')

      expect(result.success).toBe(false)
    })
  })

  describe('GET /gyms/:gymId - getById()', () => {
    test('should fetch single gym by ID (top-level)', async () => {
      const mockResponse = {
        success: true,
        data: mockGym,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await gymsApi.getById('FIT-GYM-001')

      expect(result.success).toBe(true)
      expect(result.data.gymId).toBe('FIT-GYM-001')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gyms/FIT-GYM-001'),
        expect.any(Object)
      )
    })

    test('should handle gym not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Gym not found' }),
      })

      const result = await gymsApi.getById('INVALID-GYM-999')

      expect(result.success).toBe(false)
    })
  })

  describe('POST /organizations/:orgId/gyms - create()', () => {
    test('should create gym with auto-generated gymId', async () => {
      const newGym = {
        name: 'New Gym',
        address: '789 New St',
        phone: '555-9999',
        email: 'new@gym.com',
        capacity: 150,
        manager: 'New Manager',
        status: 'ACTIVE' as const,
      }

      const mockResponse = {
        success: true,
        data: {
          ...newGym,
          gymId: 'FIT-GYM-002',
          organizationId: 'org-123',
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await gymsApi.create('org-123', newGym)

      expect(result.success).toBe(true)
      expect(result.data.gymId).toBe('FIT-GYM-002')
      expect(result.data.organizationId).toBe('org-123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123/gyms'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newGym),
        })
      )
    })

    test('should validate required gym fields', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed: name is required' }),
      })

      const result = await gymsApi.create('org-123', { address: '123 St' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })

    test('should generate sequential gym IDs', async () => {
      const gyms = ['Gym A', 'Gym B', 'Gym C']
      const results = []

      for (let i = 0; i < gyms.length; i++) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              name: gyms[i],
              gymId: `FIT-GYM-00${i + 1}`,
              organizationId: 'org-123',
            },
          }),
        })

        const result = await gymsApi.create('org-123', { name: gyms[i] })
        results.push(result.data.gymId)
      }

      expect(results).toEqual(['FIT-GYM-001', 'FIT-GYM-002', 'FIT-GYM-003'])
    })
  })

  describe('PUT /gyms/:gymId - update()', () => {
    test('should update gym using top-level route', async () => {
      const updates = {
        name: 'Updated Gym Name',
        capacity: 250,
        status: 'MAINTENANCE' as const,
      }

      const mockResponse = {
        success: true,
        data: { ...mockGym, ...updates },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await gymsApi.update('FIT-GYM-001', updates)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Gym Name')
      expect(result.data.status).toBe('MAINTENANCE')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gyms/FIT-GYM-001'),
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    test('should validate status values', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid status. Must be ACTIVE, MAINTENANCE, CLOSED, or INACTIVE',
        }),
      })

      const result = await gymsApi.update('FIT-GYM-001', { status: 'INVALID' })

      expect(result.success).toBe(false)
    })
  })

  describe('DELETE /gyms/:gymId - delete()', () => {
    test('should delete gym using top-level route', async () => {
      const mockResponse = {
        success: true,
        data: { success: true },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await gymsApi.delete('FIT-GYM-001')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gyms/FIT-GYM-001'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    test('should handle gym deletion when gym has members', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Cannot delete gym with active members',
        }),
      })

      const result = await gymsApi.delete('FIT-GYM-001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot delete')
    })
  })

  describe('Hybrid Collection Model Integration', () => {
    test('should use nested route for create and list', async () => {
      // Create uses nested route
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { gymId: 'FIT-GYM-001' },
        }),
      })

      await gymsApi.create('org-123', { name: 'Test Gym' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123/gyms'),
        expect.any(Object)
      )

      // List uses nested route
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      await gymsApi.getAll('org-123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123/gyms'),
        expect.any(Object)
      )
    })

    test('should use top-level route for read, update, delete', async () => {
      const gymId = 'FIT-GYM-001'

      // Read uses top-level
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGym }),
      })

      await gymsApi.getById(gymId)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/gyms/${gymId}`),
        expect.not.objectContaining({ method: 'POST' })
      )

      // Update uses top-level
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGym }),
      })

      await gymsApi.update(gymId, { name: 'Updated' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/gyms/${gymId}`),
        expect.objectContaining({ method: 'PUT' })
      )

      // Delete uses top-level
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await gymsApi.delete(gymId)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/gyms/${gymId}`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Complete Gym Lifecycle', () => {
    test('should handle full gym management workflow', async () => {
      const orgId = 'org-123'

      // 1. List gyms (should be empty initially)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      const initialList = await gymsApi.getAll(orgId)
      expect(initialList.data).toHaveLength(0)

      // 2. Create first gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            gymId: 'FIT-GYM-001',
            name: 'First Gym',
            organizationId: orgId,
          },
        }),
      })

      const created = await gymsApi.create(orgId, { name: 'First Gym' })
      expect(created.data.gymId).toBe('FIT-GYM-001')

      // 3. List gyms (should have one)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ gymId: 'FIT-GYM-001', name: 'First Gym' }],
        }),
      })

      const afterCreate = await gymsApi.getAll(orgId)
      expect(afterCreate.data).toHaveLength(1)

      // 4. Update gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { gymId: 'FIT-GYM-001', name: 'Updated Gym' },
        }),
      })

      const updated = await gymsApi.update('FIT-GYM-001', {
        name: 'Updated Gym',
      })
      expect(updated.data.name).toBe('Updated Gym')

      // 5. Delete gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const deleted = await gymsApi.delete('FIT-GYM-001')
      expect(deleted.success).toBe(true)

      // 6. List gyms (should be empty again)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      const finalList = await gymsApi.getAll(orgId)
      expect(finalList.data).toHaveLength(0)
    })
  })
})
