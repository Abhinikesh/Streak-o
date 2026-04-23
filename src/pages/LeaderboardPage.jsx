import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/layout/Navbar';

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ person, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl';
  const initial = (person.name || '?').charAt(0).toUpperCase();
  if (person.avatar) {
    return (
      <img
        src={person.avatar}
        alt={person.name}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-indigo-500 dark:bg-indigo-600 text-white flex items-center justify-center font-bold`}>
      {initial}
    </div>
  );
}

// ── Stat Label ─────────────────────────────────────────────────────────────────
function sortLabel(sortKey, person) {
  switch (sortKey) {
    case 'currentStreak': return `${person.currentStreak} day streak`;
    case 'bestStreak':    return `${person.bestStreak} best streak`;
    case 'thisWeekDone':  return `${person.thisWeekDone} this week`;
    case 'overallRate':   return `${person.overallRate}% rate`;
    case 'totalDone':     return `${person.totalDone} total done`;
    default:              return `${person.currentStreak} day streak`;
  }
}

// ── Podium ────────────────────────────────────────────────────────────────────
function Podium({ sorted, sortKey }) {
  if (sorted.length < 3) return null;

  const first  = sorted[0];
  const second = sorted[1];
  const third  = sorted[2];

  const PodiumCol = ({ person, rank, pillarClass, pillarH, avatarSize, medalEmoji, ringColor }) => {
    const extraGlow = person.isCurrentUser ? ' ring-offset-2 ring-2 ring-indigo-400' : '';
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl">{medalEmoji}</span>
        <div className={`relative rounded-full ring-4 ${ringColor}${extraGlow}`}>
          <Avatar person={person} size={avatarSize} />
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white text-center mt-1 max-w-[80px] truncate">{person.name}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">{sortLabel(sortKey, person)}</p>
        <div className={`w-20 ${pillarH} ${pillarClass} rounded-t-lg mt-2`} />
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h3 className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Top 3</h3>
      <div className="flex items-end justify-center gap-4 sm:gap-8">
        {/* 2nd */}
        <PodiumCol
          person={second}
          rank={2}
          pillarClass="bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-500 dark:to-gray-400"
          pillarH="h-24"
          avatarSize="md"
          medalEmoji="🥈"
          ringColor="ring-gray-300 dark:ring-gray-500"
        />
        {/* 1st */}
        <PodiumCol
          person={first}
          rank={1}
          pillarClass="bg-gradient-to-t from-yellow-400 to-yellow-300"
          pillarH="h-32"
          avatarSize="lg"
          medalEmoji="🥇"
          ringColor="ring-yellow-400"
        />
        {/* 3rd */}
        <PodiumCol
          person={third}
          rank={3}
          pillarClass="bg-gradient-to-t from-amber-600 to-amber-500"
          pillarH="h-20"
          avatarSize="md"
          medalEmoji="🥉"
          ringColor="ring-amber-600"
        />
      </div>
    </div>
  );
}

// ── Your Stats Card ────────────────────────────────────────────────────────────
function YourStatsCard({ me, rank }) {
  if (!me) return null;

  let motivation = '💪 Keep pushing, you\'re climbing!';
  if (rank === 1) motivation = '👑 You\'re leading the pack!';
  else if (rank <= 3) motivation = '🔥 So close to the top!';

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white mb-4 shadow-lg">
      <p className="text-xs font-semibold opacity-75 uppercase tracking-widest mb-1">Your Ranking</p>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-5xl font-black leading-none">#{rank}</p>
          <p className="text-sm mt-1 opacity-90">{motivation}</p>
        </div>
        <div className="flex gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-2xl font-black">{me.currentStreak}</p>
            <p className="text-xs opacity-75">Current</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{me.bestStreak}</p>
            <p className="text-xs opacity-75">Best</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{me.thisWeekDone}</p>
            <p className="text-xs opacity-75">This Week</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function LeaderboardRow({ person, rank }) {
  const rowBase = 'flex items-center px-4 sm:px-6 py-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors gap-3 sm:gap-4';
  const rowHighlight = 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500';

  return (
    <div className={`${rowBase} ${person.isCurrentUser ? rowHighlight : ''}`}>
      {/* Rank */}
      <span className="w-7 text-sm font-bold text-gray-400 dark:text-gray-500 shrink-0">{rank}</span>

      {/* Avatar */}
      <div className="shrink-0">
        <Avatar person={person} size="sm" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {person.shareCode && !person.isCurrentUser ? (
            <a
              href={`/u/${person.shareCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
            >
              {person.name}
            </a>
          ) : (
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{person.name}</span>
          )}
          {person.isCurrentUser && (
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{person.habitCount} habit{person.habitCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats — hide some on mobile */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-orange-500 dark:text-orange-400">
            {person.currentStreak > 0 ? `🔥 ${person.currentStreak}` : person.currentStreak}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Current</p>
        </div>
        <div className="text-center hidden sm:block">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{person.bestStreak}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Best</p>
        </div>
        <div className="text-center hidden md:block">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">{person.thisWeekDone}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Week</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{person.overallRate}%</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Rate</p>
        </div>
      </div>
    </div>
  );
}

// ── Rankings Table ─────────────────────────────────────────────────────────────
function RankingsTable({ sorted, startRank = 1 }) {
  if (sorted.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700/50 gap-3 sm:gap-4">
        <span className="w-7 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">#</span>
        <span className="flex-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Player</span>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Current</span>
          <span className="hidden sm:block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Best</span>
          <span className="hidden md:block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Week</span>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rate</span>
        </div>
      </div>
      {sorted.map((person, i) => (
        <LeaderboardRow key={person.userId} person={person} rank={startRank + i} />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [sortKey, setSortKey]     = useState('currentStreak');

  const { data: friendsBoard = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard', 'friends'],
    queryFn: () => axios.get('/api/leaderboard').then((r) => r.data),
  });

  const { data: globalBoard = [], isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: () => axios.get('/api/leaderboard/global').then((r) => r.data),
  });

  // ── Sorted arrays (client-side) ──────────────────────────────────────────
  const sortedFriends = useMemo(
    () => [...friendsBoard].sort((a, b) => b[sortKey] - a[sortKey]),
    [friendsBoard, sortKey]
  );

  const sortedGlobal = useMemo(
    () => [...globalBoard].sort((a, b) => b[sortKey] - a[sortKey]),
    [globalBoard, sortKey]
  );

  // ── Find current user in friends board ───────────────────────────────────
  const meIndex = sortedFriends.findIndex((p) => p.isCurrentUser);
  const me      = meIndex >= 0 ? sortedFriends[meIndex] : null;
  const myRank  = meIndex + 1;

  // For Friends tab: podium gets top-3, list starts at rank 4
  const friendsPodium  = sortedFriends.slice(0, 3);
  const friendsRest    = sortedFriends.length >= 3 ? sortedFriends.slice(3) : sortedFriends;
  const friendsRestStart = sortedFriends.length >= 3 ? 4 : 1;

  const isLoading = activeTab === 'friends' ? friendsLoading : globalLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard 🏆</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Compete with friends and the world</p>
        </div>

        {/* Tab + Sort Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          {/* Tab pills */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {['friends', 'global'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'friends' ? '👥 Friends' : '🌍 Global'}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="currentStreak">Current Streak</option>
            <option value="bestStreak">Best Streak Ever</option>
            <option value="thisWeekDone">This Week</option>
            <option value="overallRate">Overall Rate</option>
            <option value="totalDone">Total Done</option>
          </select>
        </div>

        {/* ── FRIENDS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'friends' && (
          <>
            {friendsLoading ? (
              <Spinner />
            ) : friendsBoard.length === 0 ? (
              /* Empty state — no friends */
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-5xl mb-4">🤝</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">No friends yet!</p>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Add friends to see how you compare.</p>
                <button
                  onClick={() => navigate('/friends')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md"
                >
                  Go to Friends Page →
                </button>
              </div>
            ) : (
              <>
                {/* Your Stats Card */}
                {me && <YourStatsCard me={me} rank={myRank} />}

                {/* Podium (only when 3+ people) */}
                {sortedFriends.length >= 3 && (
                  <Podium sorted={friendsPodium} sortKey={sortKey} />
                )}

                {/* Rankings list: rank 4+ (or rank 1+ if <3 total) */}
                {friendsRest.length > 0 && (
                  <RankingsTable sorted={friendsRest} startRank={friendsRestStart} />
                )}
              </>
            )}
          </>
        )}

        {/* ── GLOBAL TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'global' && (
          <>
            {globalLoading ? (
              <Spinner />
            ) : sortedGlobal.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-5xl mb-4">🌐</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">No public profiles yet</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Enable sharing in your profile to appear here!
                </p>
              </div>
            ) : (
              <RankingsTable sorted={sortedGlobal} startRank={1} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
