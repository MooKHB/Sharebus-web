export type Trip = {
  id: number;
  badge: string;
  badgeColor: string;
  from: string;
  to: string;
  time: string;
  price: number;
  duration: string;
  description: string;
};

export const trips: Trip[] = [
  {
    id: 1,
    badge: "صباحي",
    badgeColor: "sky",
    from: "مدينة نصر",
    to: "التجمع الخامس",
    time: "08:30 AM",
    price: 45,
    duration: "35 دقيقة",
    description:
      "رحلة مناسبة للتنقل اليومي السريع، مع نقطة تجمع مرنة وسهولة في الحجز.",
  },
  {
    id: 2,
    badge: "متاح الآن",
    badgeColor: "emerald",
    from: "المعادي",
    to: "وسط البلد",
    time: "09:15 AM",
    price: 40,
    duration: "30 دقيقة",
    description:
      "رحلة مريحة مناسبة للأفراد اللي عايزين وصول أسرع وتنقل يومي منظم.",
  },
  {
    id: 3,
    badge: "مسائي",
    badgeColor: "violet",
    from: "6 أكتوبر",
    to: "المهندسين",
    time: "06:00 PM",
    price: 50,
    duration: "40 دقيقة",
    description:
      "رحلة مناسبة للعودة اليومية، بتجربة مريحة وسريعة مع تفاصيل واضحة.",
  },
];