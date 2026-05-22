import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthGate'
import * as svc from '../lib/eventService'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const { user } = useAuth()

  const [allEvents,      setAllEvents]      = useState([])   // [{ event, member }]
  const [activeEvent,    setActiveEventState] = useState(null)
  const [currentMember,  setCurrentMember]  = useState(null)
  const [members,        setMembers]        = useState([])
  const [loading,        setLoading]        = useState(true)

  const userId = user?.id

  // Migrate legacy data on mount
  useEffect(() => { svc.migrateLegacyData() }, [])

  const reload = useCallback(() => {
    if (!userId) {
      setAllEvents([])
      setActiveEventState(null)
      setCurrentMember(null)
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    const memberships = svc.getAllEventsForUser(userId)
    setAllEvents(memberships)

    const bundle = svc.getActiveBundleForUser(userId)
    if (bundle) {
      setActiveEventState(bundle.event)
      setCurrentMember(bundle.member)
      setMembers(bundle.members || [])
    } else {
      setActiveEventState(null)
      setCurrentMember(null)
      setMembers([])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { reload() }, [reload])

  function switchEvent(eventId) {
    svc.setActiveEventId(eventId)
    reload()
  }

  function createEvent(data) {
    const result = svc.createEvent(userId, data)
    reload()
    return result
  }

  function createInvite() {
    if (!activeEvent) return null
    return svc.generateInvite(activeEvent.id, userId)
  }

  function acceptInvite(token, profile) {
    const result = svc.acceptInvite(token, { userId, ...profile })
    if (result.member) reload()
    return result
  }

  function updateCurrentMemberProfile(updates) {
    if (!activeEvent || !userId) return
    svc.updateMember(activeEvent.id, userId, updates)
    reload()
  }

  function setMemberRole(targetUserId, newRole) {
    if (!activeEvent) return
    svc.setMemberRole(activeEvent.id, targetUserId, newRole)
    reload()
  }

  const role    = currentMember?.role || null
  const isOwner = role === 'owner'
  const isAdmin = role === 'admin'
  const isGuest = role === 'guest'

  const permissions = svc.getEventPermissions(role)

  const eventId = activeEvent?.id || null

  return (
    <EventContext.Provider value={{
      // Multi-event
      allEvents,
      activeEvent,
      eventId,
      switchEvent,

      // Current event aliases (backward compat: pages use activeTrip)
      activeTrip: activeEvent,

      // Members
      currentMember,
      members,
      role,
      isOwner,
      isAdmin,
      isGuest,
      permissions,
      loading,

      // Actions
      createEvent,
      createInvite,
      acceptInvite,
      updateCurrentMemberProfile,
      setMemberRole,
      refreshTrip: reload,
      refreshEvent: reload,

      // Legacy alias (pages call createTrip)
      createTrip: createEvent,
    }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvent must be used within EventProvider')
  return ctx
}

// Backward-compatible alias — existing pages import useTrip
export function useTrip() {
  return useEvent()
}
