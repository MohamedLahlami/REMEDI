import { useState, useEffect, useCallback } from "react";
import { firestore, auth } from "../firebase/firebase.js";

// Hook to manage browser notifications
export const useNotificationService = () => {
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState("default");
  const [notificationCheckInterval, setNotificationCheckInterval] =
    useState(null);

  // Request permission for notifications
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  // Check current permission status on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, []);

  // Send a notification
  const sendNotification = useCallback(
    (title, options = {}) => {
      if (notificationPermissionStatus !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      try {
        const notification = new Notification(title, {
          icon: "/logo192.png", // You can replace this with your app icon
          ...options,
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options.onClick) options.onClick();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    },
    [notificationPermissionStatus]
  );

  // Check for upcoming appointments that need notifications
  const checkAppointmentNotifications = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || notificationPermissionStatus !== "granted") return;

    const now = new Date();
    const userId = user.uid;

    try {
      // Get appointments with notification times close to now
      const appointmentsRef = firestore.collection(
        `users/${userId}/appointments`
      );
      const snapshot = await appointmentsRef
        .where("notifyEnabled", "==", true)
        .get();

      if (snapshot.empty) return;

      const appointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Check each appointment
      appointments.forEach((appointment) => {
        if (!appointment.notificationTime) return;

        const notificationTime = new Date(appointment.notificationTime);
        const timeDiff = Math.abs(notificationTime.getTime() - now.getTime());

        // If it's within a 1-minute window of the scheduled notification time
        // and it hasn't been notified yet (or the flag is not set)
        if (timeDiff <= 60000 && !appointment.notified) {
          // Send notification
          const appointmentTime = new Date(
            `${appointment.date}T${appointment.time}`
          );
          const options = {
            body: `You have an appointment with Dr. ${
              appointment.doctorName
            } ${formatRelativeTime(appointmentTime)}`,
            tag: `appointment-${appointment.id}`, // Prevent duplicate notifications
            data: { appointmentId: appointment.id },
          };

          if (appointment.location) {
            options.body += ` at ${appointment.location}`;
          }

          sendNotification(
            `Appointment Reminder: ${appointment.specialty}`,
            options
          );

          // Mark as notified
          appointmentsRef.doc(appointment.id).update({
            notified: true,
          });
        }
      });
    } catch (error) {
      console.error("Error checking appointment notifications:", error);
    }
  }, [notificationPermissionStatus, sendNotification]);

  // Check for upcoming medication reminders
  const checkMedicationReminders = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || notificationPermissionStatus !== "granted") return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Format current time for comparison (HH:MM format)
    const currentTimeString = `${currentHour
      .toString()
      .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    try {
      const userId = user.uid;
      const medicationsRef = firestore.collection(
        `users/${userId}/medications`
      );
      const snapshot = await medicationsRef.get();

      if (snapshot.empty) return;

      const medications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Check each medication for time matches
      medications.forEach((medication) => {
        if (!medication.timesOfDay || !Array.isArray(medication.timesOfDay))
          return;

        medication.timesOfDay.forEach((time, index) => {
          // If the current time is within 1 minute of medication time
          const medicationTime = time.trim();
          const [medHour, medMinute] = medicationTime
            .split(":")
            .map((num) => parseInt(num));

          const medicationDate = new Date();
          medicationDate.setHours(medHour, medMinute, 0, 0);

          const timeDiff = Math.abs(now.getTime() - medicationDate.getTime());

          // If it's within a 1-minute window and not already taken
          const selected = medication.selected || [];
          if (
            timeDiff <= 60000 &&
            (!selected[index] || selected[index] === 0)
          ) {
            // Create a notification key based on medication ID and time
            const notificationKey = `med-${
              medication.id
            }-${time}-${now.toDateString()}`;

            // Check if we've already notified for this specific time today
            const notifiedToday = localStorage.getItem(notificationKey);

            if (!notifiedToday) {
              // Send notification
              const options = {
                body: `Time to take ${medication.medName} ${medication.dosage} ${medication.dosageUnit}`,
                tag: notificationKey, // Prevent duplicate notifications
                data: { medicationId: medication.id, timeIndex: index },
                requireInteraction: true,
              };

              sendNotification("Medication Reminder", options);

              // Mark as notified today in localStorage
              localStorage.setItem(notificationKey, "true");

              // Set expiry for notification key (clear after 24 hours)
              setTimeout(() => {
                localStorage.removeItem(notificationKey);
              }, 24 * 60 * 60 * 1000);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error checking medication reminders:", error);
    }
  }, [notificationPermissionStatus, sendNotification]);

  // Helper function to format time relative to now
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffMins < 60) {
      return `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
    } else if (diffHours < 24) {
      return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(diffHours / 24);
      return `in ${days} day${days !== 1 ? "s" : ""}`;
    }
  };

  // Start checking for notifications
  useEffect(() => {
    if (
      notificationPermissionStatus === "granted" &&
      !notificationCheckInterval
    ) {
      // Check for notifications every minute
      const intervalId = setInterval(() => {
        checkAppointmentNotifications();
        checkMedicationReminders();
      }, 60000);

      // Store interval ID so we can clear it later
      setNotificationCheckInterval(intervalId);

      // Also check immediately on mount
      checkAppointmentNotifications();
      checkMedicationReminders();
    }

    return () => {
      if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
      }
    };
  }, [
    notificationPermissionStatus,
    checkAppointmentNotifications,
    checkMedicationReminders,
    notificationCheckInterval,
  ]);

  return {
    notificationPermissionStatus,
    requestPermission,
    sendNotification,
  };
};

export default useNotificationService;
