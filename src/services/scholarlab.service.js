const httpStatus = require('http-status');
const axios = require('axios');
const config = require('../config/config');
const { ScholarlabSession } = require('../models');
const ApiError = require('../utils/ApiError');

// In-memory token cache
let tokenCache = {
    token: null,
    expiresAt: null,
};

/**
 * Get or refresh the Scholarlab API token
 * Caches token for 55 minutes (5-minute buffer before 60-minute expiry)
 * @returns {Promise<string>} The API token
 */
const getToken = async () => {
    const now = Date.now();

    // Return cached token if still valid
    if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) {
        return tokenCache.token;
    }

    // Fetch new token
    const clientKey = config.scholarlab.clientToken;
    if (!clientKey) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Scholarlab client token not configured');
    }

    try {
        const response = await axios.get(`${config.scholarlab.baseUrl}/ClientSimulations/GetToken`, {
            params: { client_key: clientKey },
        });

        if (!response.data || !response.data.token) {
            throw new ApiError(httpStatus.BAD_GATEWAY, 'Invalid token response from Scholarlab');
        }

        // Cache the token with TTL
        const ttlMs = config.scholarlab.tokenTtlMinutes * 60 * 1000;
        tokenCache = {
            token: response.data.token,
            expiresAt: now + ttlMs,
        };

        console.log('[Scholarlab] Token fetched and cached successfully');
        return tokenCache.token;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('[Scholarlab] Error fetching token:', error.message);
        throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to fetch Scholarlab token');
    }
};

/**
 * Generate a unique username for Scholarlab
 * Format: klassvr_{userId}_{timestamp}
 * @param {string} userId - The internal user ID
 * @returns {string} Unique username
 */
const generateUsername = (userId) => {
    const timestamp = Date.now();
    return `klassvr_${userId}_${timestamp}`;
};

/**
 * Get or create a Scholarlab session for a user
 * @param {Object} user - The user object
 * @param {string} grade - The grade to map
 * @param {string} subject - The subject for simulations
 * @returns {Promise<Object>} The Scholarlab session
 */
const getOrCreateSession = async (user, grade, subject = 'Science') => {
    let session = await ScholarlabSession.findOne({ userId: user.id || user._id });

    if (!session) {
        // Create new session with unique username
        const scholarlabUsername = generateUsername(user.id || user._id);
        session = await ScholarlabSession.create({
            userId: user.id || user._id,
            scholarlabUsername,
            emailId: user.email,
            grade,
            subject,
        });
    }

    return session;
};

/**
 * Map user to grade in Scholarlab
 * @param {Object} user - The user object
 * @param {string} grade - The grade to map
 * @param {string} subject - The subject for simulations
 * @returns {Promise<Object>} The session object
 */
const mapUserToGrade = async (user, grade, subject = 'Science') => {
    const token = await getToken();
    const session = await getOrCreateSession(user, grade, subject);

    try {
        const response = await axios.post(
            `${config.scholarlab.baseUrl}/ClientSimulations/UsersGradeMapping`,
            {
                token,
                SchoolUserUploads: [
                    {
                        UserName: session.scholarlabUsername,
                        EmailId: session.emailId,
                        Subject: subject,
                        Grades: grade,
                    },
                ],
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        // Update session with latest mapping
        session.grade = grade;
        session.subject = subject;
        session.lastMappedAt = new Date();
        await session.save();

        console.log('[Scholarlab] User grade mapping successful:', {
            username: session.scholarlabUsername,
            grade,
            subject,
        });

        return session;
    } catch (error) {
        console.error('[Scholarlab] Error mapping user to grade:', error.response?.data || error.message);

        // Handle specific errors
        if (error.response?.status === 400) {
            // Grade mapping might already exist - that's okay
            console.log('[Scholarlab] Grade mapping may already exist, continuing...');
            return session;
        }

        throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to map user to grade in Scholarlab');
    }
};

/**
 * Get simulations available for a user
 * @param {string} scholarlabUsername - The Scholarlab username
 * @returns {Promise<Array>} Array of simulations
 */
const getSimulationsForUser = async (scholarlabUsername) => {
    const token = await getToken();

    try {
        const response = await axios.post(
            `${config.scholarlab.baseUrl}/ClientSimulations/GetSimulationsWithGrades`,
            {
                token,
                userName: scholarlabUsername,
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        return response.data || [];
    } catch (error) {
        console.error('[Scholarlab] Error fetching simulations:', error.response?.data || error.message);
        throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to fetch simulations from Scholarlab');
    }
};

/**
 * Get encrypted init key for simulation launch
 * @param {string} scholarlabUsername - The Scholarlab username
 * @returns {Promise<Object>} Object with InitKey and InitUser
 */
const getInitKey = async (scholarlabUsername) => {
    const token = await getToken();
    const clientKey = config.scholarlab.clientToken;

    try {
        const response = await axios.post(
            `${config.scholarlab.baseUrl}/ClientSimulations/GetInitKey`,
            {
                token,
                clientKey,
                userName: scholarlabUsername,
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (!response.data || !response.data.InitKey || !response.data.InitUser) {
            throw new ApiError(httpStatus.BAD_GATEWAY, 'Invalid init key response from Scholarlab');
        }

        return {
            initKey: response.data.InitKey,
            initUser: response.data.InitUser,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('[Scholarlab] Error getting init key:', error.response?.data || error.message);
        throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to get init key from Scholarlab');
    }
};

/**
 * Build the final simulation launch URL
 * @param {string} simulationUrl - The base WebGL URL
 * @param {string} initKey - The encrypted init key
 * @param {string} initUser - The encrypted username
 * @returns {string} The final launch URL
 */
const buildLaunchUrl = (simulationUrl, initKey, initUser) => {
    const url = new URL(simulationUrl);
    url.searchParams.set('userName', initUser);
    url.searchParams.set('uID', initKey);
    return url.toString();
};

/**
 * Launch a simulation for a user
 * Orchestrates the full flow: grade mapping -> init key -> build URL
 * @param {Object} user - The user object
 * @param {string} simulationId - The simulation ID
 * @param {string} simulationUrl - The base WebGL URL
 * @param {string} grade - The grade for the simulation
 * @param {string} subject - The subject for the simulation
 * @returns {Promise<Object>} Object with launchUrl and session info
 */
const launchSimulation = async (user, simulationId, simulationUrl, grade, subject = 'Science') => {
    // Step 1: Ensure user is mapped to grade
    const session = await mapUserToGrade(user, grade, subject);

    // Step 2: End any existing active simulation (enforces one-at-a-time rule)
    if (session.hasActiveSimulation()) {
        session.endActiveSimulation();
    }

    // Step 3: Get encrypted init key
    const { initKey, initUser } = await getInitKey(session.scholarlabUsername);

    // Step 4: Build final launch URL
    const launchUrl = buildLaunchUrl(simulationUrl, initKey, initUser);

    // Step 5: Record active simulation
    session.activeSimulation = {
        simulationId,
        simulationUrl,
        launchUrl,
        startedAt: new Date(),
    };
    await session.save();

    console.log('[Scholarlab] Simulation launched:', {
        username: session.scholarlabUsername,
        simulationId,
        grade,
        subject,
    });

    return {
        launchUrl,
        session: {
            id: session.id,
            scholarlabUsername: session.scholarlabUsername,
            grade: session.grade,
            subject: session.subject,
        },
    };
};

/**
 * Get all simulations for a user based on their grade
 * @param {Object} user - The user object
 * @param {string} grade - The grade for simulations
 * @param {string} subject - The subject for simulations
 * @returns {Promise<Array>} Array of simulations
 */
const getSimulations = async (user, grade, subject = 'Science') => {
    // Ensure user is mapped to grade first
    const session = await mapUserToGrade(user, grade, subject);

    // Fetch simulations for the user
    const simulations = await getSimulationsForUser(session.scholarlabUsername);

    return simulations;
};

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
const clearTokenCache = () => {
    tokenCache = {
        token: null,
        expiresAt: null,
    };
};

module.exports = {
    getToken,
    generateUsername,
    getOrCreateSession,
    mapUserToGrade,
    getSimulationsForUser,
    getInitKey,
    buildLaunchUrl,
    launchSimulation,
    getSimulations,
    clearTokenCache,
};
