
const analytics = (() => {
  let apiUrl = "";
  let initialized = false;
  let visitorId = "";
  let sessionId = "";

  const eventQueue = [];
  const MAX_QUEUE_SIZE = 100;
  let isFlushing = false;

  function getOrCreateId(storage, key) {
    let id = storage.getItem(key);

    if (!id) {
      id = crypto.randomUUID();
      storage.setItem(key, id);
    }

    return id;
  }

  async function flushQueue() {
    if (!initialized || isFlushing || !navigator.onLine) {
      return;
    }

    isFlushing = true;

    try {
      while (eventQueue.length > 0) {
        const event = eventQueue[0];

        try {
          const response = await fetch(`${apiUrl}/api/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(event)
          });

          // A duplicate means the event was already stored.
          if (response.ok || response.status === 409) {
            eventQueue.shift();
            continue;
          }

          // Retry later for server errors or rate limiting.
          if (response.status >= 500 || response.status === 429) {
            console.warn("Analytics event will be retried:", event.eventName);
            break;
          }

          // Other client errors are unlikely to succeed on retry.
          console.error(
            "Analytics event rejected:",
            response.status,
            event.eventName
          );

          eventQueue.shift();
        } catch (error) {
          console.warn("Analytics request failed; event queued:", error.message);
          break;
        }
      }
    } finally {
      isFlushing = false;
    }
  }

  function enqueueEvent(event) {
    if (eventQueue.length >= MAX_QUEUE_SIZE) {
      // Keep the newest events if the queue reaches its limit.
      eventQueue.shift();
      console.warn("Analytics queue full; oldest event discarded.");
    }

    eventQueue.push(event);
    return flushQueue();
  }

  function init(config) {
    if (initialized) return;

    try {
      if (!config?.apiUrl) {
        throw new Error("An API URL is required.");
      }

      apiUrl = config.apiUrl.replace(/\/+$/, "");

      visitorId = getOrCreateId(
        localStorage,
        "analytics_visitor_id"
      );

      sessionId = getOrCreateId(
        sessionStorage,
        "analytics_session_id"
      );

      initialized = true;

      window.addEventListener("online", flushQueue);
    } catch (error) {
      console.error("Analytics SDK initialization failed:", error);
    }
  }

  function pageView() {
    return track("page_view", {
      title: document.title,
      referrer: document.referrer || "direct"
    });
  }

  function track(eventName, properties = {}) {
    if (!initialized) {
      console.warn("Analytics SDK has not been initialized.");
      return;
    }

    if (
      typeof eventName !== "string" ||
      !eventName.trim() ||
      typeof properties !== "object" ||
      properties === null ||
      Array.isArray(properties)
    ) {
      console.error("Invalid analytics event.");
      return;
    }

    const event = {
      eventId: crypto.randomUUID(),
      eventName: eventName.trim(),
      source: "browser",
      visitorId,
      sessionId,
      path: window.location.pathname,
      properties,
      timestamp: new Date().toISOString()
    };

    return enqueueEvent(event);
  }

  function getContext() {
    return { visitorId, sessionId };
  }

  return {
    init,
    pageView,
    track,
    getContext
  };
})();

export default analytics;
