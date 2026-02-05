// Team Management Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Get all teams for current manager
router.get('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const teams = await req.prisma.team.findMany({
            where: { managerId: req.user.id },
            include: {
                members: {
                    include: {
                        // We need to manually fetch user data since there's no direct relation
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch user details for each team member
        const teamsWithUsers = await Promise.all(teams.map(async (team) => {
            const membersWithUsers = await Promise.all(team.members.map(async (member) => {
                const user = await req.prisma.user.findUnique({
                    where: { id: member.userId },
                    select: { id: true, name: true, email: true, position: true, role: true }
                });
                return { ...member, user };
            }));
            return { ...team, members: membersWithUsers };
        }));

        res.json(teamsWithUsers);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get single team
router.get('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const team = await req.prisma.team.findUnique({
            where: { id: req.params.id },
            include: { members: true }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Fetch user details for each member
        const membersWithUsers = await Promise.all(team.members.map(async (member) => {
            const user = await req.prisma.user.findUnique({
                where: { id: member.userId },
                select: { id: true, name: true, email: true, position: true, role: true }
            });
            return { ...member, user };
        }));

        res.json({ ...team, members: membersWithUsers });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Create new team
router.post('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const team = await req.prisma.team.create({
            data: {
                name,
                description,
                managerId: req.user.id,
                members: {
                    create: (memberIds || []).map(userId => ({
                        userId,
                        role: 'member'
                    }))
                }
            },
            include: { members: true }
        });

        // Fetch user details for response
        const membersWithUsers = await Promise.all(team.members.map(async (member) => {
            const user = await req.prisma.user.findUnique({
                where: { id: member.userId },
                select: { id: true, name: true, email: true, position: true, role: true }
            });
            return { ...member, user };
        }));

        res.status(201).json({ ...team, members: membersWithUsers });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Update team
router.put('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const { name, description } = req.body;

        const team = await req.prisma.team.update({
            where: { id: req.params.id },
            data: { name, description }
        });

        res.json(team);
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete team
router.delete('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.team.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Team deleted' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// Add member to team
router.post('/:id/members', verifyToken, requireManagement, async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const member = await req.prisma.teamMember.create({
            data: {
                teamId: req.params.id,
                userId,
                role: role || 'member'
            }
        });

        // Fetch user details
        const user = await req.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, position: true, role: true }
        });

        res.status(201).json({ ...member, user });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User is already in this team' });
        }
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member from team
router.delete('/:id/members/:memberId', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.teamMember.delete({
            where: { id: req.params.memberId }
        });

        res.json({ message: 'Member removed' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Remove member by userId from team
router.delete('/:id/users/:userId', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.teamMember.deleteMany({
            where: {
                teamId: req.params.id,
                userId: req.params.userId
            }
        });

        res.json({ message: 'Member removed' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

export default router;
