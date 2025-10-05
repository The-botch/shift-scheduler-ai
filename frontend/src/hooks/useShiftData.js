import { useState } from 'react'
import { initialShiftData } from '../data/demoPatterns'

export const useShiftData = () => {
  const [shiftData, setShiftData] = useState(initialShiftData)
  const [changedDates, setChangedDates] = useState(new Set())

  const applyShiftChanges = changes => {
    setShiftData(prevData => {
      const newData = [...prevData]
      const newChangedDates = new Set(changedDates)

      changes.forEach(change => {
        const dayIndex = newData.findIndex(d => d.date === change.date)
        if (dayIndex !== -1) {
          newChangedDates.add(change.date)

          if (change.action === 'remove') {
            newData[dayIndex].shifts = newData[dayIndex].shifts.filter(s => s.name !== change.staff)
          } else if (change.action === 'add') {
            newData[dayIndex].shifts.push({
              name: change.staff,
              time: change.time,
              skill: change.skill,
              changed: true,
            })
          } else if (change.action === 'modify') {
            const shiftIndex = newData[dayIndex].shifts.findIndex(s => s.name === change.staff)
            if (shiftIndex !== -1) {
              newData[dayIndex].shifts[shiftIndex] = {
                ...newData[dayIndex].shifts[shiftIndex],
                time: change.time,
                changed: true,
              }
            }
          }
        }
      })

      setChangedDates(newChangedDates)
      return newData
    })
  }

  const resetShiftData = () => {
    setShiftData(initialShiftData)
    setChangedDates(new Set())
  }

  return {
    shiftData,
    changedDates,
    applyShiftChanges,
    resetShiftData,
  }
}
