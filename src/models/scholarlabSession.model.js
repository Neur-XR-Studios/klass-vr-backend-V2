const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Scholarlab Session Schema
 * Tracks user sessions and grade mappings for Scholarlab simulations
 */
const scholarlabSessionSchema = new mongoose.Schema(
    {
        // Reference to the internal user
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Generated unique username for Scholarlab (format: klassvr_{userId}_{timestamp})
        scholarlabUsername: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // User email for Scholarlab mapping
        emailId: {
            type: String,
            required: true,
        },
        // Mapped grade for simulations
        grade: {
            type: String,
            required: true,
        },
        // Subject for simulations
        subject: {
            type: String,
            default: 'Science',
        },
        // Last time grade mapping was updated
        lastMappedAt: {
            type: Date,
            default: Date.now,
        },
        // Currently active simulation (enforces one-at-a-time rule)
        activeSimulation: {
            simulationId: String,
            simulationUrl: String,
            launchUrl: String,
            startedAt: Date,
        },
        // Session history
        sessions: [
            {
                simulationId: String,
                simulationUrl: String,
                launchUrl: String,
                launchedAt: {
                    type: Date,
                    default: Date.now,
                },
                endedAt: Date,
            },
        ],
    },
    {
        timestamps: true,
    }
);

scholarlabSessionSchema.plugin(toJSON);
scholarlabSessionSchema.plugin(paginate);

/**
 * Check if user already has an active simulation
 * @returns {boolean}
 */
scholarlabSessionSchema.methods.hasActiveSimulation = function () {
    return !!(this.activeSimulation && this.activeSimulation.simulationId);
};

/**
 * End the current active simulation
 */
scholarlabSessionSchema.methods.endActiveSimulation = function () {
    if (this.activeSimulation && this.activeSimulation.simulationId) {
        // Move to session history
        this.sessions.push({
            ...this.activeSimulation,
            endedAt: new Date(),
        });
        // Clear active simulation
        this.activeSimulation = null;
    }
};

const ScholarlabSession = mongoose.model('ScholarlabSession', scholarlabSessionSchema);

module.exports = ScholarlabSession;
