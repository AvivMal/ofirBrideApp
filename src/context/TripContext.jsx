import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../components/AuthGate'
import * as svc from '../lib/tripService'

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const { user } = useAuth()
  const [activeTrip, setActiveTrip]       = useState(null)
  const [currentMember, setCurrentMember] = useState(null)
  const [members, setMembers]             = useState([])
  const [loading, setLoading]             = useState(true)

  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      setActiveTrip(null)
      setCurrentMember(null)
      setMembers([])
      setLoading(false)
      return
    }
    reload()
  }, [userId])

  function reload() {
    setLoading(true)
    const result = svc.getActiveTripForUser(userId)
    if (result) {
      setActiveTrip(result.trip)
      setMembers(result.members)
      setCurrentMember(result.member)
    } else {
      setActiveTrip(null)
      setMembers([])
      setCurrentMember(null)
    }
    setLoading(false)
  }

  function createTrip(data) {
    const result = svc.createTrip(userId, data)
    setActiveTrip(result.trip)
    setMembers([result.member])
    setCurrentMember(result.member)
    return result
  }

  function createInvite() {
    if (!activeTrip) return null
    return svc.generateInvite(activeTrip.id, userId)
  }

  function acceptInvite(token, profile) {
    const result = svc.acceptInvite(token, { userId, ...profile })
    if (result.member) reload()
    return result
  }

  const role    = currentMember?.role || null
  const isOwner = role === 'owner'
  const isGuest = role === 'guest'

  const permissions = {
    canEditSchedule:              isOwner,
    canInviteFriends:             isOwner,
    canManageMembers:             isOwner,
    canSendMessages:              isOwner || isGuest,
    canUploadPhotos:              isOwner || isGuest,
    canAddPlaces:                 isOwner || isGuest,
    canOpenPrivateChatWithBride:  isGuest,
    canModerateContent:           isOwner,
  }

  return (
    <TripContext.Provider value={{
      activeTrip, currentMember, members, role, isOwner, isGuest,
      permissions, loading,
      createTrip, createInvite, acceptInvite,
      refreshTrip: reload,
    }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}
