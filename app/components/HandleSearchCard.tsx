function handleSearch() {
  setSubmitted(true);

  if (!destination.trim()) {
    return;
  }

  const normalizedDestination = destination.trim().toLowerCase();

  const result = trips.find((t) =>
    t.to_location.toLowerCase().includes(normalizedDestination)
  );

  if (result) {
    window.location.href = `/book/${result.id}`;
    return;
  }

  const tripsSection = document.getElementById("trips");
  if (tripsSection) {
    tripsSection.scrollIntoView({ behavior: "smooth" });
  } else {
    alert("مفيش رحلة مطابقة حاليًا، جرّب من قائمة الرحلات");
  }
}