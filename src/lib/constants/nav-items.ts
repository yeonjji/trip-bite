export interface NavSubItem {
  href: string
  labelKey: string
}

export interface NavItem {
  labelKey: string
  href: string        // top-level href (used as labelHref in PC dropdown, direct link in mobile)
  children: NavSubItem[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "travel",
    href: "/travel",
    children: [
      { href: "/travel", labelKey: "allDestinations" },
    ],
  },
  {
    labelKey: "camping",
    href: "/camping",
    children: [
      { href: "/camping",                       labelKey: "allCamping" },
      { href: "/camping?induty=일반야영장",      labelKey: "generalCamping" },
      { href: "/camping?induty=자동차야영장",    labelKey: "carCamping" },
      { href: "/camping?induty=카라반",          labelKey: "caravan" },
      { href: "/camping?induty=글램핑",          labelKey: "glamping" },
    ],
  },
  {
    labelKey: "events",
    href: "/events",
    children: [
      { href: "/events",                  labelKey: "allEvents" },
      { href: "/events?status=ongoing",   labelKey: "ongoingEvents" },
      { href: "/events?status=upcoming",  labelKey: "upcomingEvents" },
    ],
  },
  {
    labelKey: "restaurants",
    href: "/restaurants",
    children: [
      { href: "/restaurants",                      labelKey: "allRestaurants" },
      { href: "/restaurants?cat3=A05020100",       labelKey: "korean" },
      { href: "/restaurants?cat3=A05020200",       labelKey: "western" },
      { href: "/restaurants?cat3=A05020300",       labelKey: "japanese" },
      { href: "/restaurants?cat3=A05020400",       labelKey: "chinese" },
      { href: "/restaurants?cat3=A05020900",       labelKey: "cafe" },
    ],
  },
  {
    labelKey: "facilities",
    href: "/facilities",
    children: [
      { href: "/facilities/ev-charging", labelKey: "evCharging" },
      { href: "/facilities/wifi",        labelKey: "publicWifi" },
      { href: "/facilities/restrooms",   labelKey: "restrooms" },
      { href: "/facilities/parking",     labelKey: "parking" },
    ],
  },
  {
    labelKey: "recipes",
    href: "/recipes",
    children: [],
  },
]
