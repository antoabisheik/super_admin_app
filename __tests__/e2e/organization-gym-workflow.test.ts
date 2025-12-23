/**
 * End-to-End Workflow Tests
 * Tests complete user workflows across multiple components and API calls
 */

import { organizationsApi, gymsApi } from '@/api/api-clients-with-gyms'
import { getAuth } from 'firebase/auth'

global.fetch = jest.fn()

describe('E2E: Organization and Gym Management Workflow', () => {
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

  describe('Complete Organization Lifecycle', () => {
    test('should create org, add gym, update both, then delete both', async () => {
      // Step 1: Create Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'org-new',
            email: 'neworg@example.com',
            name: 'New Fitness Org',
            city: 'New York',
            state: 'NY',
            zip: '10001',
          },
        }),
      })

      const orgResult = await organizationsApi.create({
        email: 'neworg@example.com',
        name: 'New Fitness Org',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      })

      expect(orgResult.success).toBe(true)
      expect(orgResult.data.id).toBe('org-new')

      const orgId = orgResult.data.id

      // Step 2: Verify Organization Created
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: orgResult.data,
        }),
      })

      const orgReadResult = await organizationsApi.getById(orgId)
      expect(orgReadResult.success).toBe(true)
      expect(orgReadResult.data.id).toBe(orgId)

      // Step 3: Create Gym in Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            gymId: 'NEW-GYM-001',
            name: 'First Gym',
            address: '123 Gym St',
            manager: 'Gym Manager',
            phone: '555-1111',
            email: 'gym@example.com',
            capacity: 200,
            status: 'ACTIVE',
            organizationId: orgId,
          },
        }),
      })

      const gymResult = await gymsApi.create(orgId, {
        name: 'First Gym',
        address: '123 Gym St',
        manager: 'Gym Manager',
        phone: '555-1111',
        email: 'gym@example.com',
        capacity: 200,
        status: 'ACTIVE',
      })

      expect(gymResult.success).toBe(true)
      expect(gymResult.data.gymId).toBe('NEW-GYM-001')
      expect(gymResult.data.organizationId).toBe(orgId)

      const gymId = gymResult.data.gymId

      // Step 4: List Gyms for Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [gymResult.data],
        }),
      })

      const gymListResult = await gymsApi.getAll(orgId)
      expect(gymListResult.success).toBe(true)
      expect(gymListResult.data).toHaveLength(1)
      expect(gymListResult.data[0].gymId).toBe(gymId)

      // Step 5: Update Gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...gymResult.data,
            name: 'Updated Gym Name',
            capacity: 250,
          },
        }),
      })

      const gymUpdateResult = await gymsApi.update(gymId, {
        name: 'Updated Gym Name',
        capacity: 250,
      })

      expect(gymUpdateResult.success).toBe(true)
      expect(gymUpdateResult.data.name).toBe('Updated Gym Name')

      // Step 6: Update Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...orgResult.data,
            city: 'Los Angeles',
            state: 'CA',
          },
        }),
      })

      const orgUpdateResult = await organizationsApi.update(orgId, {
        city: 'Los Angeles',
        state: 'CA',
      })

      expect(orgUpdateResult.success).toBe(true)
      expect(orgUpdateResult.data.city).toBe('Los Angeles')

      // Step 7: Delete Gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { success: true },
        }),
      })

      const gymDeleteResult = await gymsApi.delete(gymId)
      expect(gymDeleteResult.success).toBe(true)

      // Step 8: Verify Gym Deleted
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      })

      const verifyGymList = await gymsApi.getAll(orgId)
      expect(verifyGymList.data).toHaveLength(0)

      // Step 9: Delete Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { success: true },
        }),
      })

      const orgDeleteResult = await organizationsApi.delete(orgId)
      expect(orgDeleteResult.success).toBe(true)

      // Step 10: Verify Organization Deleted
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Organization not found',
        }),
      })

      const verifyOrgDeleted = await organizationsApi.getById(orgId)
      expect(verifyOrgDeleted.success).toBe(false)
    })
  })

  describe('Multi-Gym Organization Workflow', () => {
    test('should create org with multiple gyms and manage them', async () => {
      // Create Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'org-multi',
            name: 'Multi-Gym Org',
            email: 'multi@example.com',
          },
        }),
      })

      const orgResult = await organizationsApi.create({
        name: 'Multi-Gym Org',
        email: 'multi@example.com',
      })

      const orgId = orgResult.data.id

      // Create 3 Gyms
      const gymNames = ['Downtown Gym', 'Uptown Gym', 'Suburban Gym']
      const createdGyms = []

      for (let i = 0; i < gymNames.length; i++) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              gymId: `MULTI-GYM-00${i + 1}`,
              name: gymNames[i],
              address: `${100 + i} Street`,
              manager: `Manager ${i + 1}`,
              phone: `555-000${i}`,
              email: `gym${i}@example.com`,
              capacity: 100 + i * 50,
              status: 'ACTIVE',
              organizationId: orgId,
            },
          }),
        })

        const gymResult = await gymsApi.create(orgId, {
          name: gymNames[i],
          address: `${100 + i} Street`,
          manager: `Manager ${i + 1}`,
          phone: `555-000${i}`,
          email: `gym${i}@example.com`,
          capacity: 100 + i * 50,
          status: 'ACTIVE',
        })

        createdGyms.push(gymResult.data)
        expect(gymResult.success).toBe(true)
      }

      // List All Gyms
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: createdGyms,
        }),
      })

      const gymList = await gymsApi.getAll(orgId)
      expect(gymList.success).toBe(true)
      expect(gymList.data).toHaveLength(3)

      // Update Middle Gym Status to MAINTENANCE
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...createdGyms[1],
            status: 'MAINTENANCE',
          },
        }),
      })

      const gymUpdate = await gymsApi.update('MULTI-GYM-002', {
        status: 'MAINTENANCE',
      })

      expect(gymUpdate.success).toBe(true)
      expect(gymUpdate.data.status).toBe('MAINTENANCE')

      // Delete First Gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const deleteFirstGym = await gymsApi.delete('MULTI-GYM-001')
      expect(deleteFirstGym.success).toBe(true)

      // Verify Only 2 Gyms Remain
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [createdGyms[1], createdGyms[2]],
        }),
      })

      const remainingGyms = await gymsApi.getAll(orgId)
      expect(remainingGyms.data).toHaveLength(2)
    })
  })

  describe('Error Recovery Workflow', () => {
    test('should handle partial failures and recover', async () => {
      // Create Organization Successfully
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'org-error',
            name: 'Error Test Org',
          },
        }),
      })

      const orgResult = await organizationsApi.create({
        name: 'Error Test Org',
      })

      expect(orgResult.success).toBe(true)
      const orgId = orgResult.data.id

      // Try to Create Gym (Fails - Validation Error)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed: phone is required',
        }),
      })

      const gymFailure = await gymsApi.create(orgId, {
        name: 'Incomplete Gym',
        address: '123 St',
      })

      expect(gymFailure.success).toBe(false)
      expect(gymFailure.error).toContain('Validation failed')

      // Retry with Complete Data (Succeeds)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            gymId: 'ERR-GYM-001',
            name: 'Complete Gym',
            address: '123 St',
            phone: '555-0000',
            manager: 'Manager',
            email: 'gym@example.com',
            capacity: 100,
            status: 'ACTIVE',
            organizationId: orgId,
          },
        }),
      })

      const gymSuccess = await gymsApi.create(orgId, {
        name: 'Complete Gym',
        address: '123 St',
        phone: '555-0000',
        manager: 'Manager',
        email: 'gym@example.com',
        capacity: 100,
        status: 'ACTIVE',
      })

      expect(gymSuccess.success).toBe(true)

      // Verify Gym Created
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [gymSuccess.data],
        }),
      })

      const gymList = await gymsApi.getAll(orgId)
      expect(gymList.data).toHaveLength(1)
    })

    test('should handle network failures with retries', async () => {
      let attempt = 0

      ;(global.fetch as jest.Mock).mockImplementation(async () => {
        attempt++
        if (attempt === 1) {
          throw new Error('Network error')
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'org-retry',
              name: 'Retry Org',
            },
          }),
        }
      })

      // First attempt fails
      const firstAttempt = await organizationsApi.create({ name: 'Retry Org' })
      expect(firstAttempt.success).toBe(false)

      // Retry succeeds
      const secondAttempt = await organizationsApi.create({ name: 'Retry Org' })
      expect(secondAttempt.success).toBe(true)
      expect(secondAttempt.data.id).toBe('org-retry')
    })
  })

  describe('Concurrent Operations', () => {
    test('should handle concurrent gym creations', async () => {
      const orgId = 'org-concurrent'
      const gymCount = 5

      // Mock create responses for all gyms
      for (let i = 0; i < gymCount; i++) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              gymId: `CONC-GYM-00${i + 1}`,
              name: `Concurrent Gym ${i + 1}`,
              organizationId: orgId,
            },
          }),
        })
      }

      // Create all gyms concurrently
      const promises = Array.from({ length: gymCount }, (_, i) =>
        gymsApi.create(orgId, {
          name: `Concurrent Gym ${i + 1}`,
        })
      )

      const results = await Promise.all(promises)

      // Verify all succeeded
      expect(results).toHaveLength(gymCount)
      results.forEach((result, i) => {
        expect(result.success).toBe(true)
        expect(result.data.gymId).toBe(`CONC-GYM-00${i + 1}`)
      })
    })
  })

  describe('Data Consistency', () => {
    test('should maintain referential integrity between org and gyms', async () => {
      // Create Organization
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'org-integrity',
            name: 'Integrity Test Org',
          },
        }),
      })

      const org = await organizationsApi.create({ name: 'Integrity Test Org' })
      const orgId = org.data.id

      // Create Gym
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            gymId: 'INT-GYM-001',
            name: 'Integrity Gym',
            organizationId: orgId,
          },
        }),
      })

      const gym = await gymsApi.create(orgId, { name: 'Integrity Gym' })

      // Verify gym has correct organizationId
      expect(gym.data.organizationId).toBe(orgId)

      // Try to delete organization (should fail - has gyms)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Cannot delete organization with existing gyms',
        }),
      })

      const deleteOrgAttempt = await organizationsApi.delete(orgId)
      expect(deleteOrgAttempt.success).toBe(false)

      // Delete gym first
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const deleteGym = await gymsApi.delete('INT-GYM-001')
      expect(deleteGym.success).toBe(true)

      // Now delete organization (should succeed)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const deleteOrg = await organizationsApi.delete(orgId)
      expect(deleteOrg.success).toBe(true)
    })
  })
})
