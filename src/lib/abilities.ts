import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

// Define the subjects (resources) in your app
export type Subjects =
    | 'Dashboard'
    | 'Equipment'
    | 'Metrology'
    | 'Inventory'
    | 'Maintenance'
    | 'Settings'
    | 'User'
    | 'all';

// Define the actions users can perform
export type Actions =
    | 'manage' // Special action that represents all actions
    | 'read'
    | 'create'
    | 'update'
    | 'delete'
    | 'calibrate'
    | 'schedule'
    | 'complete';

// Create the Ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// User roles enum to match Prisma
export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER'
}

// Define permissions for each role
export function defineAbilitiesFor(userRole: UserRole): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (userRole) {
        case UserRole.ADMIN:
            // Admins can do everything
            can('manage', 'all');
            break;

        case UserRole.MANAGER:
            // Managers can manage most things but not user management
            can('read', 'Dashboard');
            can(['read', 'create', 'update', 'delete'], 'Equipment');
            can(['read', 'create', 'update', 'delete', 'calibrate'], 'Metrology');
            can('read', 'Inventory');
            can(['read', 'create', 'update', 'delete', 'schedule', 'complete'], 'Maintenance');
            can('read', 'Settings');
            break;

        case UserRole.OPERATOR:
            // Operators can view and update operational data
            can('read', 'Dashboard');
            can(['read', 'update'], 'Equipment');
            can('read', 'Metrology');
            can('read', 'Inventory');
            can(['read', 'update', 'complete'], 'Maintenance');
            cannot('create', 'Maintenance'); // Can't schedule new maintenance
            break;

        case UserRole.VIEWER:
            // Viewers can only read data
            can('read', ['Dashboard', 'Equipment', 'Metrology', 'Inventory', 'Maintenance']);
            break;

        default:
            // Default to viewer permissions
            can('read', ['Dashboard', 'Equipment', 'Metrology', 'Inventory', 'Maintenance']);
    }

    return build();
}

// Helper function to check if user can access a navigation item
export function canAccessNavItem(ability: AppAbility, navItemPath: string): boolean {
    const pathToSubjectMap: Record<string, Subjects> = {
        '/': 'Dashboard',
        '/equipment': 'Equipment',
        '/metrology': 'Metrology',
        '/inventory': 'Inventory',
        '/maintenance': 'Maintenance',
        '/settings': 'Settings'
    };

    const subject = pathToSubjectMap[navItemPath];
    return subject ? ability.can('read', subject) : false;
}
