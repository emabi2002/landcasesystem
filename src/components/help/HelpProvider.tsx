'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  getTopicById,
  getTopicForRoute,
  type HelpRole,
  type HelpTopic,
} from '@/help/help-content';
import { useGuidedTour } from './GuidedTour';

type HelpView = 'home' | 'article';

interface HelpContextValue {
  /** Whether the help drawer is open. */
  isOpen: boolean;
  /** The current view inside the drawer. */
  view: HelpView;
  /** The topic being shown in article view (may be route-based or user-selected). */
  activeTopic: HelpTopic | null;
  /** The topic that matches the current page route (null if unknown). */
  routeTopic: HelpTopic | null;
  /** Currently selected role for role-based guidance. */
  role: HelpRole | 'all';

  openHelp: (topicId?: string) => void;
  closeHelp: () => void;
  showTopic: (topicId: string) => void;
  showHome: () => void;
  setRole: (role: HelpRole | 'all') => void;
  startTour: (tourId: string) => void;
}

const HelpContext = createContext<HelpContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'dlpp_help_role';

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { startTour: runTour } = useGuidedTour();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<HelpView>('home');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [role, setRoleState] = useState<HelpRole | 'all'>('all');

  // Load the saved role preference once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(ROLE_STORAGE_KEY) as
      | HelpRole
      | 'all'
      | null;
    if (saved) setRoleState(saved);
  }, []);

  const setRole = useCallback((next: HelpRole | 'all') => {
    setRoleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROLE_STORAGE_KEY, next);
    }
  }, []);

  const routeTopic = useMemo(() => getTopicForRoute(pathname), [pathname]);

  const activeTopic = useMemo(() => {
    if (view === 'article') {
      return getTopicById(selectedTopicId) ?? routeTopic;
    }
    return routeTopic;
  }, [view, selectedTopicId, routeTopic]);

  const openHelp = useCallback(
    (topicId?: string) => {
      if (topicId) {
        setSelectedTopicId(topicId);
        setView('article');
      } else if (routeTopic) {
        setSelectedTopicId(routeTopic.id);
        setView('article');
      } else {
        // Unknown route -> show the Help Centre home inside the drawer.
        setSelectedTopicId(null);
        setView('home');
      }
      setIsOpen(true);
    },
    [routeTopic],
  );

  const closeHelp = useCallback(() => setIsOpen(false), []);

  const showTopic = useCallback((topicId: string) => {
    setSelectedTopicId(topicId);
    setView('article');
  }, []);

  const showHome = useCallback(() => {
    setSelectedTopicId(null);
    setView('home');
  }, []);

  const startTour = useCallback(
    (tourId: string) => {
      // Close the drawer first so the highlighted elements are visible.
      setIsOpen(false);
      runTour(tourId);
    },
    [runTour],
  );

  const value = useMemo<HelpContextValue>(
    () => ({
      isOpen,
      view,
      activeTopic,
      routeTopic,
      role,
      openHelp,
      closeHelp,
      showTopic,
      showHome,
      setRole,
      startTour,
    }),
    [
      isOpen,
      view,
      activeTopic,
      routeTopic,
      role,
      openHelp,
      closeHelp,
      showTopic,
      showHome,
      setRole,
      startTour,
    ],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return ctx;
}
