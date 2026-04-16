import { CommunityService } from './community.service';
export declare class CommunityController {
    private readonly service;
    constructor(service: CommunityService);
    getPosts(category?: string, search?: string, page?: string, limit?: string, showHidden?: string, req?: any): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                username: string;
                avatar: string;
            } | null;
            _count: {
                likes: number;
                comments: number;
            };
        } & {
            id: string;
            title: string;
            content: string;
            category: string;
            userId: string | null;
            viewCount: number;
            likeCount: number;
            isPinned: boolean;
            isHidden: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, req: any): Promise<{
        liked: boolean;
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
        comments: ({} & {
            id: string;
            content: string;
            userId: string | null;
            createdAt: Date;
            updatedAt: Date;
            postId: string;
            authorName: string | null;
        })[];
        _count: {
            likes: number;
            comments: number;
        };
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(body: {
        title: string;
        content: string;
        category: string;
    }, req: any): Promise<{
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }> | {
        error: string;
    };
    delete(id: string, req: any): Promise<{
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }> | {
        error: string;
    };
    toggleLike(id: string, req: any): Promise<{
        liked: boolean;
    }> | {
        error: string;
    };
    getComments(id: string): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }[]>;
    addComment(id: string, body: {
        content: string;
        authorName?: string;
    }, req: any): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }>;
    deleteComment(id: string, commentId: string, req: any): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }> | {
        error: string;
    };
}
