'use client';
import React from 'react';
/* Iconos SVG (stroke) -> window.Icons */

  const e = React.createElement;
  const S = (props, children) =>
    e("svg", Object.assign({
      width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
    }, props), children);

  const P = (dAttr) => e("path", { d: dAttr });

  const Icons = {
    Calendar: (p) => S(p, [e("rect",{key:1,x:3,y:4,width:18,height:17,rx:2.5}), e("path",{key:2,d:"M3 9h18"}), e("path",{key:3,d:"M8 2v4M16 2v4"})]),
    Chevron: (p) => S(p, P("M9 6l6 6-6 6")),
    ChevronLeft: (p) => S(p, P("M15 6l-6 6 6 6")),
    ChevronDown: (p) => S(p, P("M6 9l6 6 6-6")),
    Plus: (p) => S(p, [e("path",{key:1,d:"M12 5v14"}), e("path",{key:2,d:"M5 12h14"})]),
    Search: (p) => S(p, [e("circle",{key:1,cx:11,cy:11,r:7}), e("path",{key:2,d:"M21 21l-4.3-4.3"})]),
    Clock: (p) => S(p, [e("circle",{key:1,cx:12,cy:12,r:9}), e("path",{key:2,d:"M12 7v5l3 2"})]),
    MapPin: (p) => S(p, [e("path",{key:1,d:"M12 21s-7-5.6-7-11a7 7 0 1114 0c0 5.4-7 11-7 11z"}), e("circle",{key:2,cx:12,cy:10,r:2.5})]),
    User: (p) => S(p, [e("circle",{key:1,cx:12,cy:8,r:4}), e("path",{key:2,d:"M4 21c0-4 3.5-6 8-6s8 2 8 6"})]),
    Phone: (p) => S(p, P("M5 4h3l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z")),
    Home: (p) => S(p, [e("path",{key:1,d:"M4 11l8-6 8 6"}), e("path",{key:2,d:"M6 10v9h12v-9"})]),
    Bed: (p) => S(p, [e("path",{key:1,d:"M3 18V8M3 12h15a3 3 0 013 3v3"}), e("path",{key:2,d:"M3 18h18M7 11.5h3"})]),
    Tag: (p) => S(p, [e("path",{key:1,d:"M3 11V5a2 2 0 012-2h6l9 9-8 8-9-9z"}), e("circle",{key:2,cx:7.5,cy:7.5,r:1.4})]),
    Wrench: (p) => S(p, P("M14.5 6.5a3.5 3.5 0 00-4.6 4.2L4 16.6 7.4 20l5.9-5.9a3.5 3.5 0 004.2-4.6l-2.3 2.3-2-2 2.3-2.3z")),
    Eye: (p) => S(p, [e("path",{key:1,d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"}), e("circle",{key:2,cx:12,cy:12,r:3})]),
    Alert: (p) => S(p, [e("path",{key:1,d:"M12 3l9 16H3l9-16z"}), e("path",{key:2,d:"M12 10v4M12 17h.01"})]),
    List: (p) => S(p, [e("path",{key:1,d:"M8 6h13M8 12h13M8 18h13"}), e("path",{key:2,d:"M3.5 6h.01M3.5 12h.01M3.5 18h.01"})]),
    Grid: (p) => S(p, [e("rect",{key:1,x:3,y:3,width:7,height:7,rx:1.5}), e("rect",{key:2,x:14,y:3,width:7,height:7,rx:1.5}), e("rect",{key:3,x:3,y:14,width:7,height:7,rx:1.5}), e("rect",{key:4,x:14,y:14,width:7,height:7,rx:1.5})]),
    Columns: (p) => S(p, [e("rect",{key:1,x:3,y:4,width:18,height:16,rx:2}), e("path",{key:2,d:"M9 4v16M15 4v16"})]),
    Close: (p) => S(p, [e("path",{key:1,d:"M6 6l12 12"}), e("path",{key:2,d:"M18 6L6 18"})]),
    Check: (p) => S(p, P("M5 12l4.5 4.5L19 7")),
    Bell: (p) => S(p, [e("path",{key:1,d:"M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"}), e("path",{key:2,d:"M10 20a2 2 0 004 0"})]),
    Filter: (p) => S(p, P("M3 5h18l-7 8v5l-4 2v-7L3 5z")),
    Dots: (p) => S(p, [e("circle",{key:1,cx:5,cy:12,r:1.6}), e("circle",{key:2,cx:12,cy:12,r:1.6}), e("circle",{key:3,cx:19,cy:12,r:1.6})]),
    Edit: (p) => S(p, [e("path",{key:1,d:"M4 20h4l10-10-4-4L4 16v4z"}), e("path",{key:2,d:"M13.5 6.5l4 4"})]),
    Trash: (p) => S(p, [e("path",{key:1,d:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"})]),
    Building: (p) => S(p, [e("rect",{key:1,x:5,y:3,width:14,height:18,rx:1.5}), e("path",{key:2,d:"M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"})]),
    Sun: (p) => S(p, [e("circle",{key:1,cx:12,cy:12,r:4}), e("path",{key:2,d:"M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"})]),
    Layout: (p) => S(p, [e("rect",{key:1,x:3,y:4,width:18,height:16,rx:2}), e("path",{key:2,d:"M3 9h18M9 9v11"})]),
    ExternalLink: (p) => S(p, [e("path",{key:1,d:"M14 4h6v6"}), e("path",{key:2,d:"M20 4l-9 9"}), e("path",{key:3,d:"M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"})]),
    Camera: (p) => S(p, [e("path",{key:1,d:"M3 8h3l1.5-2h9L18 8h3a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z"}), e("circle",{key:2,cx:12,cy:13,r:3.2})]),
    Clipboard: (p) => S(p, [e("rect",{key:1,x:5,y:4,width:14,height:17,rx:2}), e("path",{key:2,d:"M9 4a1 1 0 011-1h4a1 1 0 011 1v2H9V4z"}), e("path",{key:3,d:"M8.5 12l2 2 4-4"})]),
    Coins: (p) => S(p, [e("ellipse",{key:1,cx:12,cy:7,rx:7,ry:3}), e("path",{key:2,d:"M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"}), e("path",{key:3,d:"M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"})]),
    SignPost: (p) => S(p, [e("path",{key:1,d:"M12 3v18"}), e("path",{key:2,d:"M6 6h11l2.5 2.5L17 11H6z"}), e("path",{key:3,d:"M8 14h9"})]),
    FileText: (p) => S(p, [e("path",{key:1,d:"M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"}), e("path",{key:2,d:"M14 3v5h5"}), e("path",{key:3,d:"M9 13h6M9 17h6"})]),
    Inbox: (p) => S(p, [e("path",{key:1,d:"M4 13l2.5-7h11L20 13"}), e("path",{key:2,d:"M4 13v5a1 1 0 001 1h14a1 1 0 001-1v-5h-5a2 2 0 01-4 0H4z"})]),
    LogOut: (p) => S(p, [e("path",{key:1,d:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"}), e("path",{key:2,d:"M16 17l5-5-5-5"}), e("path",{key:3,d:"M21 12H9"})]),
  };

  export default Icons;
export { Icons };

