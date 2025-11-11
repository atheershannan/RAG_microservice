import { logger as defaultLogger } from '../utils/logger.util.js';

let defaultSkillsEnginePromise = null;
let defaultLearnerAIPromise = null;
let defaultAssessmentPromise = null;
let defaultDevLabPromise = null;
let defaultQueryProcessingPromise = null;

async function resolveDefaultSkillsEngine() {
  if (!defaultSkillsEnginePromise) {
    try {
      const module = await import('../clients/educore-skills.client.js');
      defaultSkillsEnginePromise = Promise.resolve(module.skillsEngineClient);
    } catch (error) {
      defaultSkillsEnginePromise = Promise.resolve(null);
    }
  }

  return defaultSkillsEnginePromise;
}

async function resolveDefaultLearnerAI() {
  if (!defaultLearnerAIPromise) {
    try {
      const module = await import('../clients/educore-learner.client.js');
      defaultLearnerAIPromise = Promise.resolve(module.learnerAIClient);
    } catch (error) {
      defaultLearnerAIPromise = Promise.resolve(null);
    }
  }

  return defaultLearnerAIPromise;
}

async function resolveDefaultAssessment() {
  if (!defaultAssessmentPromise) {
    try {
      const module = await import('../clients/educore-assessment.client.js');
      defaultAssessmentPromise = Promise.resolve(module.assessmentClient);
    } catch (error) {
      defaultAssessmentPromise = Promise.resolve(null);
    }
  }

  return defaultAssessmentPromise;
}

async function resolveDefaultDevLab() {
  if (!defaultDevLabPromise) {
    try {
      const module = await import('../clients/educore-devlab.client.js');
      defaultDevLabPromise = Promise.resolve(module.devlabClient);
    } catch (error) {
      defaultDevLabPromise = Promise.resolve(null);
    }
  }

  return defaultDevLabPromise;
}

async function resolveDefaultQueryProcessing() {
  if (!defaultQueryProcessingPromise) {
    const module = await import('./query-processing.service.js');
    defaultQueryProcessingPromise = Promise.resolve(module.queryProcessingService);
  }

  return defaultQueryProcessingPromise;
}

class PersonalizedAssistanceService {
  constructor({
    skillsEngineClient = undefined,
    learnerAIClient = undefined,
    assessmentClient = undefined,
    devlabClient = undefined,
    queryProcessingService = undefined,
    logger = defaultLogger,
  } = {}) {
    const hasCustomSkillsEngine = skillsEngineClient !== undefined;
    const hasCustomLearnerAI = learnerAIClient !== undefined;
    const hasCustomAssessment = assessmentClient !== undefined;
    const hasCustomDevLab = devlabClient !== undefined;
    const hasCustomQueryProc = queryProcessingService !== undefined;

    this.skillsEngineProvider = hasCustomSkillsEngine
      ? () => Promise.resolve(skillsEngineClient)
      : () => resolveDefaultSkillsEngine();
    this.learnerAIProvider = hasCustomLearnerAI
      ? () => Promise.resolve(learnerAIClient)
      : () => resolveDefaultLearnerAI();
    this.assessmentProvider = hasCustomAssessment
      ? () => Promise.resolve(assessmentClient)
      : () => resolveDefaultAssessment();
    this.devlabProvider = hasCustomDevLab
      ? () => Promise.resolve(devlabClient)
      : () => resolveDefaultDevLab();
    this.queryProcessingProvider = hasCustomQueryProc
      ? () => Promise.resolve(queryProcessingService)
      : () => resolveDefaultQueryProcessing();

    this.logger = logger;
  }

  async buildUserContext({ tenantId, userId }) {
    const [skillsEngine, learnerAI, assessment, devlab] = await Promise.all([
      this.skillsEngineProvider(),
      this.learnerAIProvider(),
      this.assessmentProvider(),
      this.devlabProvider(),
    ]);

    const context = {
      skillGaps: [],
      learningProgress: {},
      assessments: [],
      devlab: {},
    };

    if (skillsEngine?.getSkillGaps) {
      try {
        const gaps = await skillsEngine.getSkillGaps({ tenantId, userId });
        context.skillGaps = gaps?.gaps ?? [];
      } catch (error) {
        this.logger.warn('Failed to fetch skill gaps', {
          tenantId,
          userId,
          error: error.message,
        });
      }
    }

    if (learnerAI?.getLearningProgress) {
      try {
        context.learningProgress = await learnerAI.getLearningProgress({ tenantId, userId });
      } catch (error) {
        this.logger.warn('Failed to fetch learning progress', {
          tenantId,
          userId,
          error: error.message,
        });
      }
    }

    if (assessment?.getLatestAssessments) {
      try {
        context.assessments = await assessment.getLatestAssessments({ tenantId, userId });
      } catch (error) {
        this.logger.warn('Failed to fetch assessment data', {
          tenantId,
          userId,
          error: error.message,
        });
      }
    }

    if (devlab?.getDevLabProgress) {
      try {
        context.devlab = await devlab.getDevLabProgress({ tenantId, userId });
      } catch (error) {
        this.logger.warn('Failed to fetch DevLab progress', {
          tenantId,
          userId,
          error: error.message,
        });
      }
    }

    return context;
  }

  async generateRecommendations({ tenantId, userId, context }) {
    const queryProcessingService = await this.queryProcessingProvider();

    if (!queryProcessingService?.generateRecommendations) {
      return { courses: [], exercises: [] };
    }

    try {
      return await queryProcessingService.generateRecommendations({
        tenantId,
        userId,
        context,
      });
    } catch (error) {
      this.logger.warn('Failed to generate personalized recommendations', {
        tenantId,
        userId,
        error: error.message,
      });
      return { courses: [], exercises: [] };
    }
  }

  async getPersonalizedQuery({ tenantId, userId, query, sessionId = null }) {
    const queryProcessingService = await this.queryProcessingProvider();
    if (!queryProcessingService?.processQuery) {
      throw new Error('Query processing service unavailable');
    }

    const context = await this.buildUserContext({ tenantId, userId });

    try {
      const response = await queryProcessingService.processQuery({
        tenantId,
        userId,
        sessionId,
        query,
        metadata: {
          skillGaps: context.skillGaps,
          learningProgress: context.learningProgress,
          assessments: context.assessments,
          devlab: context.devlab,
        },
      });

      const recommendations = await this.generateRecommendations({ tenantId, userId, context });

      return {
        ...response,
        recommendations,
        context,
      };
    } catch (error) {
      this.logger.error('Personalized query generation failed', {
        tenantId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

const personalizedAssistanceService = new PersonalizedAssistanceService();

export { PersonalizedAssistanceService, personalizedAssistanceService };
