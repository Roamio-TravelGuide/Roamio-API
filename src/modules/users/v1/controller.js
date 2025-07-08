import { UserService } from './service';

class UserController {
    constructor() {
        this.userService = new UserService();
    }

    async getUsers(req, res) {
        try {
            const filterOptions = {
                role: this.parseUserRole(req.query.role),
                status: this.parseUserStatus(req.query.status),
                search: req.query.search ? String(req.query.search) : undefined,
                page: req.query.page ? Number(req.query.page) : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
                sortBy: this.parseSortBy(req.query.sortBy),
                sortOrder: this.parseSortOrder(req.query.sortOrder)
            };

            const users = await this.userService.getAllUsers(filterOptions);
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    parseUserRole(role) {
        if (typeof role !== 'string') return undefined;
        const validRoles = ['admin', 'moderator', 'traveler', 'travel_guide', 'vendor'];
        return validRoles.includes(role) ? role : undefined;
    }

    parseUserStatus(status) {
        if (typeof status !== 'string') return undefined;
        const validStatuses = ['pending', 'active', 'blocked'];
        return validStatuses.includes(status) ? status : undefined;
    }

    parseSortBy(sortBy) {
        if (typeof sortBy !== 'string') return undefined;
        const validSortFields = ['registered_date', 'name', 'last_login'];
        return validSortFields.includes(sortBy) ? sortBy : undefined;
    }

    parseSortOrder(sortOrder) {
        if (typeof sortOrder !== 'string') return undefined;
        return sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined;
    }

    async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            if (status !== 'active' && status !== 'blocked') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid status value. Must be either "active" or "blocked"'
                });
                return;
            }

            await this.userService.updateUserStatus(parseInt(userId), status);
            res.status(200).json({
                success: true,
                message: 'User status updated successfully'
            });
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user status',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = { UserController };