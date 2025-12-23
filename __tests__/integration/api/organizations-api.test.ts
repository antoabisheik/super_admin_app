/**
 * Integration Tests for Organizations API
 * Tests the complete flow of CRUD operations for organizations
 */
import { organizationsApi } from '@/api/api-clients-with-gyms'
import { getAuth } from 'firebase/auth'
// Mock fetch globally
global.fetch = jest.fn()

describe('Organizations API Integration Tests', () => {
  const mockOrganization = {
    id: 'org-123',
    email: 'test@example.com',
    name: 'Test Organization',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    role: 'Admin',
    status: 'active',
    tags: ['Marketing', 'Sales'],
    avatar: 'J',
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

  describe('GET /organizations - getAll()', () => {
    test('should fetch all organizations successfully', async () => {
      const mockResponse = {
        success: true,
        data: [mockOrganization],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await organizationsApi.getAll()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject(mockOrganization)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    test('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      })

      const result = await organizationsApi.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await organizationsApi.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })

  describe('GET /organizations/:id - getById()', () => {
    test('should fetch organization by ID successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockOrganization,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await organizationsApi.getById('org-123')

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject(mockOrganization)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123'),
        expect.any(Object)
      )
    })

    test('should handle organization not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Organization not found' }),
      })

      const result = await organizationsApi.getById('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('POST /organizations - create()', () => {
    test('should create organization successfully', async () => {
      const newOrg = {
        email: 'new@example.com',
        name: 'New Organization',
        firstName: 'Jane',
        lastName: 'Smith',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
      }

      const mockResponse = {
        success: true,
        data: { ...newOrg, id: 'org-456' },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await organizationsApi.create(newOrg)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('org-456')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newOrg),
        })
      )
    })

    test('should handle validation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed: email is required' }),
      })

      const result = await organizationsApi.create({ name: 'Incomplete Org' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })
  })

  describe('PUT /organizations/:id - update()', () => {
    test('should update organization successfully', async () => {
      const updates = {
        name: 'Updated Organization',
        city: 'San Francisco',
      }

      const mockResponse = {
        success: true,
        data: { ...mockOrganization, ...updates },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await organizationsApi.update('org-123', updates)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Organization')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      )
    })

    test('should handle unauthorized update', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden: insufficient permissions' }),
      })

      const result = await organizationsApi.update('org-123', { name: 'New Name' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')
    })
  })

  describe('DELETE /organizations/:id - delete()', () => {
    test('should delete organization successfully', async () => {
      const mockResponse = {
        success: true,
        data: { success: true },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await organizationsApi.delete('org-123')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    test('should handle delete of non-existent organization', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Organization not found' }),
      })

      const result = await organizationsApi.delete('invalid-id')

      expect(result.success).toBe(false)
    })
  })

  describe('Authentication Integration', () => {
    test('should include auth token in all requests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      await organizationsApi.getAll()

      expect(mockAuthUser.getIdToken).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      )
    })

    test('should handle missing authentication', async () => {
      ;(getAuth as jest.Mock).mockReturnValue({
        currentUser: null,
      })

      const result = await organizationsApi.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toContain('not authenticated')
    })
  })

  describe('End-to-End Workflow', () => {
    test('should complete full CRUD lifecycle', async () => {
      // 1. Create
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'org-new', email: 'workflow@test.com' },
        }),
      })

      const createResult = await organizationsApi.create({
        email: 'workflow@test.com',
        name: 'Workflow Test',
      })
      expect(createResult.success).toBe(true)
      const orgId = createResult.data.id

      // 2. Read
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: orgId, email: 'workflow@test.com' },
        }),
      })

      const readResult = await organizationsApi.getById(orgId)
      expect(readResult.success).toBe(true)

      // 3. Update
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: orgId, email: 'updated@test.com' },
        }),
      })

      const updateResult = await organizationsApi.update(orgId, {
        email: 'updated@test.com',
      })
      expect(updateResult.success).toBe(true)

      // 4. Delete
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const deleteResult = await organizationsApi.delete(orgId)
      expect(deleteResult.success).toBe(true)
    })
  })
})
