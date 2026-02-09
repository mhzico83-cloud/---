
export type UserRole = 'nazih' | 'idari' | 'khariji';
export type HousingStatus = 'هدم كُلي' | 'هدم جُزئي' | 'منطقة قتال';
export type ShelterType = 'خيمة' | 'صف';
export type HealthStatus = 'مُعافى' | 'مريض مُزمن' | 'مصاب حرب' | 'إعاقة';
export type Gender = 'ذكر' | 'أُنثى';

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'زوج' | 'زوجة' | 'ابن' | 'ابنة';
  idNumber: string;
  birthDate: string;
  isPregnant?: boolean;
  isNursing?: boolean;
  medicalDoc?: string; // Base64 لشهادة الحمل أو الميلاد
}

export interface ExternalDependent {
  id: string;
  fullName: string;
  relation: string; // نصي كما طلب المستخدم
  idNumber: string;
  birthDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'registration' | 'approval' | 'system' | 'edit_request';
}

export interface IDP {
  id: string;
  role: UserRole;
  adminTitle?: string;
  name: string;
  idNumber: string;
  birthDate: string;
  phone: string;
  walletNumber: string;
  addressBefore: string;
  detailedAddress?: string; // للخارجي
  housingStatus: HousingStatus;
  shelterType: ShelterType;
  shelterNumber: string;
  gender: Gender;
  maritalStatus: string;
  healthStatus: HealthStatus;
  healthDetails?: string;
  familyMembers: FamilyMember[];
  externalDependents: ExternalDependent[];
  password?: string;
  docs: {
    idImage?: string;
    agencyCard?: string;
    profilePic?: string;
  };
  location: string;
  familySize: number;
  status: 'Pending' | 'Approved' | 'Served' | 'Critical' | 'Suspended';
  lastAidDate: string;
  needs: string[];
  pendingData?: Partial<IDP>;
}

export type View = 'dashboard' | 'idp-list' | 'aid-services' | 'reports' | 'messages';

// Added Message interface for messaging system
export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
}

// Added Conversation interface for messaging system
export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  messages: Message[];
}
