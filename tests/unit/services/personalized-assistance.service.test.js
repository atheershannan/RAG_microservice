import { jest } from '@jest/globals';

import { PersonalizedAssistanceService } from '../../../src/services/personalized-assistance.service.js';

describe('PersonalizedAssistanceService', () => {
  const tenantId = 'tenant-123';
  const userId = 'user-456';
  const query = 'How can I improve my React skills?';

  let skillsEngineClient;
  let learnerAIClient;
  let assessmentClient;
  let devlabClient;
  let queryProcessingService;
  let loggerMock;
  let service;

  beforeEach(() => {
    skillsEngineClient = {
      getSkillGaps: jest.fn().mockResolvedValue({
        gaps: ['React state management'],
      }),
    };

    learnerAIClient = {
      getLearningProgress: jest.fn().mockResolvedValue({
        completedCourses: 5,
        inProgressCourses: 1,
      }),
    };

    assessmentClient = {
      getLatestAssessments: jest.fn().mockResolvedValue([{ id: 'assess-1' }]),
    };

    devlabClient = {
      getDevLabProgress: jest.fn().mockResolvedValue({
        exercisesCompleted: 3,
      }),
    };

    queryProcessingService = {
      processQuery: jest.fn().mockResolvedValue({
        answer: 'Tailored answer',
        sources: [],
        metadata: {},
      }),
      generateRecommendations: jest.fn().mockResolvedValue({
        courses: ['React Advanced'],
        exercises: ['State management quiz'],
      }),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new PersonalizedAssistanceService({
      skillsEngineClient,
      learnerAIClient,
      assessmentClient,
      devlabClient,
      queryProcessingService,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildUserContext', () => {
    it('aggregates data from multiple services', async () => {
      const context = await service.buildUserContext({ tenantId, userId });

      expect(skillsEngineClient.getSkillGaps).toHaveBeenCalledWith({ tenantId, userId });
      expect(learnerAIClient.getLearningProgress).toHaveBeenCalledWith({ tenantId, userId });
      expect(assessmentClient.getLatestAssessments).toHaveBeenCalledWith({ tenantId, userId });
      expect(devlabClient.getDevLabProgress).toHaveBeenCalledWith({ tenantId, userId });

      expect(context).toEqual({
        skillGaps: ['React state management'],
        learningProgress: {
          completedCourses: 5,
          inProgressCourses: 1,
        },
        assessments: [{ id: 'assess-1' }],
        devlab: {
          exercisesCompleted: 3,
        },
      });
    });

    it('continues when one of the services fails', async () => {
      skillsEngineClient.getSkillGaps.mockRejectedValueOnce(new Error('down'));

      const context = await service.buildUserContext({ tenantId, userId });

      expect(loggerMock.warn).toHaveBeenCalledWith('Failed to fetch skill gaps', {
        tenantId,
        userId,
        error: 'down',
      });
      expect(context.skillGaps).toEqual([]);
    });
  });

  describe('getPersonalizedQuery', () => {
    it('enriches the query, calls query processing, and returns personalized response', async () => {
      const response = await service.getPersonalizedQuery({
        tenantId,
        userId,
        query,
      });

      expect(queryProcessingService.processQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          query,
          metadata: expect.objectContaining({
            skillGaps: ['React state management'],
          }),
        })
      );
      expect(response).toEqual({
        answer: 'Tailored answer',
        sources: [],
        metadata: {},
        recommendations: {
          courses: ['React Advanced'],
          exercises: ['State management quiz'],
        },
        context: expect.any(Object),
      });
    });

    it('falls back gracefully when recommendations fail', async () => {
      queryProcessingService.generateRecommendations.mockRejectedValueOnce(new Error('recommendations failed'));

      const response = await service.getPersonalizedQuery({ tenantId, userId, query });

      expect(loggerMock.warn).toHaveBeenCalledWith('Failed to generate personalized recommendations', {
        tenantId,
        userId,
        error: 'recommendations failed',
      });
      expect(response.recommendations).toEqual({ courses: [], exercises: [] });
      expect(response.answer).toBe('Tailored answer');
      expect(response.sources).toEqual([]);
    });

    it('logs and rethrows query processing errors', async () => {
      queryProcessingService.processQuery.mockRejectedValueOnce(new Error('process failed'));

      await expect(service.getPersonalizedQuery({ tenantId, userId, query })).rejects.toThrow(
        'process failed'
      );
      expect(loggerMock.error).toHaveBeenCalledWith('Personalized query generation failed', {
        tenantId,
        userId,
        error: 'process failed',
      });
    });
  });
});
