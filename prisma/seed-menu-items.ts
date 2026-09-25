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
      {
        title: 'Collaboration',
        href: '#',
        icon: 'UsersIcon',
        order: 1,
        children: [
          { title: 'Messenger', href: '/apps/chat', icon: 'MessageSquareIcon', order: 0 },
          { title: 'Feed', href: '/collaboration/feed', icon: 'FolderDotIcon', order: 1 },
          { title: 'Collabs', href: '/collaboration/collabs', icon: 'ClipboardMinusIcon', order: 2 },
          { title: 'Online Documents', href: '/collaboration/documents', icon: 'ComponentIcon', order: 3 },
          {
            title: 'File Manager',
            href: '/file-manager',
            icon: 'FolderIcon',
            order: 4,
            children: [
              { title: 'Dashboard', href: '/file-manager', icon: 'FolderIcon', order: 0 },
              { title: 'File Manager', href: '/apps/file-manager', icon: 'ArchiveRestoreIcon', order: 1 },
            ]
          },
          { title: 'Work Groups', href: '/collaboration/work-groups', icon: 'GroupIcon', order: 5 },
          { title: 'Boards', href: '/collaboration/boards', icon: 'LayoutDashboardIcon', order: 6 },
        ]
      },
      {
        title: 'E-commerce',
        href: '#',
        icon: 'ShoppingBagIcon',
        order: 2,
        children: [
          { title: 'E-commerce Dashboard', href: '/ecommerce', icon: 'ChartPieIcon', order: 0 },
          { title: 'Product List', href: '/pages/products', icon: 'Package', order: 1 },
          { title: 'Product Detail', href: '/pages/products/1', icon: 'ComponentIcon', order: 2 },
          { title: 'Add Product', href: '/pages/products/create', icon: 'Plus', order: 3 },
          { title: 'Customers', href: '/crm/customers', icon: 'UsersIcon', order: 4 },
          { title: 'Order List', href: '/pages/orders', icon: 'ShoppingCart', order: 5 },
          { title: 'Order Detail', href: '/pages/orders/detail', icon: 'FileText', order: 6 },
          { title: 'Returns', href: '/pages/returns', icon: 'RotateCcw', order: 7 },
        ]
      },
      {
        title: 'CRM',
        href: '#',
        icon: 'ChartBarDecreasingIcon',
        order: 4,
        children: [
          { title: 'CRM Dashboard', href: '/crm', icon: 'ChartPieIcon', order: 0 },
          { title: 'Leads', href: '/crm/leads', icon: 'UserIcon', order: 1 },
          { title: 'Contacts', href: '/crm/contacts', icon: 'UsersIcon', order: 2 },
          { title: 'Deals', href: '/crm/deals', icon: 'BadgeDollarSignIcon', order: 3 },
          { title: 'Form Builder', href: '/pages/form-builder', icon: 'ComponentIcon', order: 4 },
          { title: 'Settings', href: '/crm/settings', icon: 'SettingsIcon', order: 5 },
          { title: 'Dashboards', href: '/crm/deals/dashboards', icon: 'LayoutDashboardIcon', order: 6 },
        ]
      },
      {
        title: 'Project Management',
        href: '/project-management',
        icon: 'FolderDotIcon',
        order: 5,
        children: [
          { title: 'PM Dashboard', href: '/project-management', icon: 'LayoutDashboardIcon', order: 0 },
          { title: 'Project List', href: '/project-list', icon: 'List', order: 1 },
          { title: 'Tasks', href: '/apps/tasks', icon: 'ClipboardCheckIcon', order: 2 },
        ]
      },
      {
        title: 'Payment Dashboard',
        href: '/payment',
        icon: 'CreditCardIcon',
        order: 6,
        children: [
          { title: 'Payment Dashboard', href: '/payment', icon: 'LayoutDashboardIcon', order: 0 },
          { title: 'Transactions', href: '/payment/transactions', icon: 'WalletMinimalIcon', order: 1 },
        ]
      },
    ]
  },
  {
    group: 'Apps',
    items: [
      { title: 'Users', href: '/pages/users', icon: 'UsersIcon', order: 0 },
      { title: 'Notes', href: '/apps/notes', icon: 'StickyNoteIcon', isDataBadge: '8', order: 2 },
      { title: 'Automation', href: '/pages/business-processes', icon: 'Workflow', order: 3 },
      { title: 'Mail', href: '/apps/mail', icon: 'MailIcon', order: 4 },
      { title: 'Todo List App', href: '/apps/todo-list-app', icon: 'SquareCheckIcon', order: 5 },
      { title: 'Calendar', href: '/apps/calendar', icon: 'CalendarIcon', order: 6 },
      { title: 'POS App', href: '/apps/pos-system', icon: 'CookieIcon', order: 8 },
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
          { title: 'Fitness', href: '/widgets/fitness', order: 0 },
          { title: 'E-commerce', href: '/widgets/ecommerce', order: 1 },
          { title: 'Analytics', href: '/widgets/analytics', order: 2 },
        ]
      },
      {
        title: 'Login History',
        href: '/pages/login-history',
        icon: 'HistoryIcon',
        order: 1,
      },
    ]
  },
];

async function seedMenuItems() {
  console.log('Seeding menu items...');

  // Clear only the global (default) menu items this function owns. Company-specific
  // rows (e.g. the platform-owner's Administration group, companyId != null) must
  // survive a reseed - they aren't part of menuData and can't be recreated here.
  await prisma.menuItem.deleteMany({ where: { companyId: null } });

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


































