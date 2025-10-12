// src/controllers/userController.js
import { UserService } from "./service.js";

export class UserController {
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

    async getTravelerProfile(req,res){
        try {
            const { userId } = req.params;
            // Implement the logic to get traveler profile using userService
            const profile = await this.userService.getTravelerProfile(parseInt(userId));
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error fetching traveler profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch traveler profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async updateUserProfile(req, res) {
        try {
            const { name, email, phoneNo } = req.body;
            const userId = req.params.userId;

            console.log('Updating profile for user:', userId, 'with data:', { name, email, phoneNo });
            
            const updatedProfile = await this.userService.updateProfile(userId, {
                fullName: name,
                email,
                phone: phoneNo
            });
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }


    async getGuideProfile(req, res) {
        try {
            const { userId } = req.params;
            const profile = await this.userService.getGuideProfile(parseInt(userId));
            
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error fetching guide profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch guide profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getGuidePerformance(req, res) {
        try {
            const {userId} = req.params;
            const performance = await this.userService.getGuidePerformance(parseInt(userId));
            
            res.status(200).json({
                success: true,
                data: performance
            });
        } catch (error) {
            console.error('Error fetching guide performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch guide performance',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getGuideDocuments(req, res) {
        try {
            const {userId} = req.params;
            const documents = await this.userService.getGuideDocuments(parseInt(userId));
            
            res.status(200).json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error fetching guide documents:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch guide documents',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async getGuideId(req, res) {
        try {
            const { userId } = req.params;
            
            if (!userId || isNaN(parseInt(userId))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }

            const result = await this.userService.getGuideId(parseInt(userId));

            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message
            });
        } catch (error) {
            console.error('Error in getGuideId controller:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}