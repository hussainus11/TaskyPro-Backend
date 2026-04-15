import { prisma } from '../lib/prisma';

type MenuSeedItem = {
  title: string;
  href: string;
  icon?: string;
  order: number;
  isComing?: boolean;
  isNew?: boolean;
  isDataBadge?: string;
  children?: MenuSeedItem[];
};

type MenuSeedGroup = {
  group: string;
  items: MenuSeedItem[];
};

// Icon mapping - these are the icon names from lucide-react
const iconMap: Record<string, string> = {
  ChartPieIcon: 'ChartPie',
  UsersIcon: 'Users',
  MessageSquareIcon: 'MessageSquare',
  FolderDotIcon: 'FolderDot',
  ClipboardMinusIcon: 'ClipboardMinus',
  ComponentIcon: 'Component',
  FolderIcon: 'Folder',
  ArchiveRestoreIcon: 'ArchiveRestore',
  GroupIcon: 'Group',
  LayoutDashboardIcon: 'LayoutDashboard',
  ShoppingBagIcon: 'ShoppingBag',
  Package: 'Package',
  Plus: 'Plus',
  ShoppingCart: 'ShoppingCart',
  FileText: 'FileText',
  BadgeDollarSignIcon: 'BadgeDollarSign',
  ChartBarDecreasingIcon: 'ChartBar',
  UserIcon: 'User',
  SettingsIcon: 'Settings',
  List: 'List',
  ClipboardCheckIcon: 'ClipboardCheck',
  CreditCardIcon: 'CreditCard',
  WalletMinimalIcon: 'Wallet',
  Building2Icon: 'Building2',
  StickyNoteIcon: 'StickyNote',
  MessageSquareHeartIcon: 'MessageSquareHeart',
  MailIcon: 'Mail',
  SquareCheckIcon: 'SquareCheck',
  CalendarIcon: 'Calendar',
  KeyIcon: 'Key',
  CookieIcon: 'Cookie',
  BrainIcon: 'Brain',
  BrainCircuitIcon: 'BrainCircuit',
  ImagesIcon: 'Images',
  SpeechIcon: 'Speech',
  FingerprintIcon: 'Fingerprint',
  BrushCleaningIcon: 'Brush',
  PuzzleIcon: 'Puzzle',
  HistoryIcon: 'History',
  RotateCcw: 'RotateCcw',
};

// Menu structure from nav-main.tsx
const menuData: MenuSeedGroup[] = [
  {
    group: 'Dashboards',
    items: [
      { title: 'Default', href: '/dashboard/default', icon: 'ChartPieIcon', order: 0 },
      {
        title: 'Collaboration',
        href: '#',
        icon: 'UsersIcon',
        order: 1,
        children: [
          { title: 'Messenger', href: '/dashboard/apps/chat', icon: 'MessageSquareIcon', order: 0 },
          { title: 'Feed', href: '/dashboard/collaboration/feed', icon: 'FolderDotIcon', order: 1 },
          { title: 'Collabs', href: '/dashboard/collaboration/collabs', icon: 'ClipboardMinusIcon', order: 2 },
          { title: 'Online Documents', href: '/dashboard/collaboration/documents', icon: 'ComponentIcon', order: 3 },
          {
            title: 'File Manager',
            href: '/dashboard/file-manager',
            icon: 'FolderIcon',
            order: 4,
            children: [
              { title: 'Dashboard', href: '/dashboard/file-manager', icon: 'FolderIcon', order: 0 },
              { title: 'File Manager', href: '/dashboard/apps/file-manager', icon: 'ArchiveRestoreIcon', order: 1 },
            ]
          },
          { title: 'Work Groups', href: '/dashboard/collaboration/work-groups', icon: 'GroupIcon', order: 5 },
          { title: 'Boards', href: '/dashboard/collaboration/boards', icon: 'LayoutDashboardIcon', order: 6 },
        ]
      },
      {
        title: 'E-commerce',
        href: '#',
        icon: 'ShoppingBagIcon',
        order: 2,
        children: [
          { title: 'E-commerce Dashboard', href: '/dashboard/ecommerce', icon: 'ChartPieIcon', order: 0 },
          { title: 'Product List', href: '/dashboard/pages/products', icon: 'Package', order: 1 },
          { title: 'Product Detail', href: '/dashboard/pages/products/1', icon: 'ComponentIcon', order: 2 },
          { title: 'Add Product', href: '/dashboard/pages/products/create', icon: 'Plus', order: 3 },
          { title: 'Customers', href: '/dashboard/crm/customers', icon: 'UsersIcon', order: 4 },
          { title: 'Order List', href: '/dashboard/pages/orders', icon: 'ShoppingCart', order: 5 },
          { title: 'Order Detail', href: '/dashboard/pages/orders/detail', icon: 'FileText', order: 6 },
          { title: 'Returns', href: '/dashboard/pages/returns', icon: 'RotateCcw', order: 7 },
        ]
      },
      {
        title: 'CRM',
        href: '#',
        icon: 'ChartBarDecreasingIcon',
        order: 4,
        children: [
          { title: 'CRM Dashboard', href: '/dashboard/crm', icon: 'ChartPieIcon', order: 0 },
          { title: 'Leads', href: '/dashboard/crm/leads', icon: 'UserIcon', order: 1 },
          { title: 'Contacts', href: '/dashboard/crm/contacts', icon: 'UsersIcon', order: 2 },
          { title: 'Deals', href: '/dashboard/crm/deals', icon: 'BadgeDollarSignIcon', order: 3 },
          { title: 'Form Builder', href: '/dashboard/pages/form-builder', icon: 'ComponentIcon', order: 4 },
          { title: 'Settings', href: '/dashboard/crm/settings', icon: 'SettingsIcon', order: 5 },
        ]
      },
      {
        title: 'Project Management',
        href: '/dashboard/project-management',
        icon: 'FolderDotIcon',
        order: 5,
        children: [
          { title: 'PM Dashboard', href: '/dashboard/project-management', icon: 'LayoutDashboardIcon', order: 0 },
          { title: 'Project List', href: '/dashboard/project-list', icon: 'List', order: 1 },
          { title: 'Tasks', href: '/dashboard/apps/tasks', icon: 'ClipboardCheckIcon', order: 2 },
        ]
      },
      {
        title: 'Payment Dashboard',
        href: '/dashboard/payment',
        icon: 'CreditCardIcon',
        order: 6,
        children: [
          { title: 'Payment Dashboard', href: '/dashboard/payment', icon: 'LayoutDashboardIcon', order: 0 },
          { title: 'Transactions', href: '/dashboard/payment/transactions', icon: 'WalletMinimalIcon', order: 1 },
        ]
      },
    ]
  },
  {
    group: 'Apps',
    items: [
      { title: 'Users', href: '/dashboard/pages/users', icon: 'UsersIcon', order: 0 },
      { title: 'Companies', href: '/dashboard/pages/companies', icon: 'Building2Icon', order: 1 },
      { title: 'Notes', href: '/dashboard/apps/notes', icon: 'StickyNoteIcon', isDataBadge: '8', order: 2 },
      { title: 'Social Media', href: '/dashboard/apps/social-media', icon: 'MessageSquareHeartIcon', isNew: true, order: 3 },
      { title: 'Mail', href: '/dashboard/apps/mail', icon: 'MailIcon', order: 4 },
      { title: 'Todo List App', href: '/dashboard/apps/todo-list-app', icon: 'SquareCheckIcon', order: 5 },
      { title: 'Calendar', href: '/dashboard/apps/calendar', icon: 'CalendarIcon', order: 6 },
      { title: 'POS App', href: '/dashboard/apps/pos-system', icon: 'CookieIcon', order: 8 },
    ]
  },
  {
    group: 'Others',
    items: [
      {
        title: 'Widgets',
        href: '#',
        icon: 'PuzzleIcon',
        order: 0,
        children: [
          { title: 'Fitness', href: '/dashboard/widgets/fitness', order: 0 },
          { title: 'E-commerce', href: '/dashboard/widgets/ecommerce', order: 1 },
          { title: 'Analytics', href: '/dashboard/widgets/analytics', order: 2 },
        ]
      },
      {
        title: 'Login History',
        href: '/dashboard/pages/login-history',
        icon: 'HistoryIcon',
        order: 1,
      },
    ]
  },
];

async function seedMenuItems() {
  console.log('Seeding menu items...');

  // Clear existing menu items
  await prisma.menuItem.deleteMany({});

  // Create menu items
  for (const groupData of menuData) {
    for (const item of groupData.items) {
      const parent = await prisma.menuItem.create({
        data: {
          title: item.title,
          href: item.href,
          icon: item.icon ? iconMap[item.icon] || item.icon : null,
          group: groupData.group,
          order: item.order,
          isActive: true,
          isComing: item.isComing || false,
          isNew: item.isNew || false,
          isDataBadge: item.isDataBadge || null,
          newTab: false,
        }
      });

      // Create children if they exist
      if (Array.isArray(item.children) && item.children.length > 0) {
        for (const child of item.children) {
          await prisma.menuItem.create({
            data: {
              title: child.title,
              href: child.href,
              icon: child.icon ? iconMap[child.icon] || child.icon : null,
              group: groupData.group,
              parentId: parent.id,
              order: child.order,
              isActive: true,
              isComing: child.isComing || false,
              isNew: child.isNew || false,
              isDataBadge: child.isDataBadge || null,
              newTab: false,
            }
          });
        }
      }
    }
  }

  console.log('Menu items seeded successfully!');
}

// Run if called directly
if (require.main === module) {
  seedMenuItems()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedMenuItems };


































