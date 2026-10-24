import React from 'react';
import { Unit, GearItem } from '../types/game';

interface VisualPaperdollProps {
  unit: Unit;
  equipped?: Record<string, GearItem>;
  size?: 'sm' | 'md' | 'lg';
}

export const VisualPaperdoll: React.FC<VisualPaperdollProps> = ({
  unit,
  equipped = {},
  size = 'md',
}) => {
  const weapon = equipped.weapon;
  const shield = equipped.shield;
  const armor = equipped.armor;

  const skin = unit.skinTone || '#fed7aa';
  const hair = unit.hairColor || '#1e293b';
  const hairStyle = unit.hairStyle || 'short';
  const cloak = unit.cloakColor || unit.color || '#3b82f6';

  const armorFam =
    armor?.armorFamily ||
    (armor?.name.includes('Giáp') || armor?.name.includes('Thép')
      ? 'iron'
      : armor?.name.includes('Choàng')
      ? 'robe'
      : armor?.name.includes('Kim')
      ? 'gold'
      : 'leather');

  const shieldFam =
    shield?.shieldFamily ||
    (shield?.name.includes('Aegis') || shield?.name.includes('Thần Quy')
      ? 'aegis'
      : shield?.name.includes('Tròn')
      ? 'buckler'
      : 'iron');

  const weaponFam = weapon?.family || 'sword';

  const dim = size === 'sm' ? 44 : size === 'lg' ? 120 : 76;

  // Dark shadow skin shade
  const skinShadow = '#d4a373';
  // Hair highlight shade
  const hairHighlight = '#94a3b8';

  return (
    <div
      className="relative flex items-center justify-center rounded-lg bg-gradient-to-b from-[#0b0f19] to-[#050811] border border-amber-900/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden select-none shrink-0"
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      >
        {/* Pixel Pedestal Shadow */}
        <rect x="8" y="28" width="16" height="2" fill="rgba(0, 0, 0, 0.6)" />
        <rect x="10" y="27" width="12" height="1" fill="rgba(0, 0, 0, 0.4)" />

        {/* 1. Flowing Pixel Cloak */}
        <rect x="9" y="12" width="14" height="15" fill={cloak} />
        <rect x="8" y="14" width="16" height="13" fill={cloak} />
        <rect x="7" y="18" width="18" height="9" fill={cloak} />
        {/* Cloak folds & shadow */}
        <rect x="10" y="14" width="2" height="13" fill="rgba(0,0,0,0.25)" />
        <rect x="20" y="14" width="2" height="13" fill="rgba(0,0,0,0.25)" />

        {/* 2. Legs & Leather Greaves/Boots */}
        <rect x="12" y="23" width="3" height="5" fill="#334155" />
        <rect x="17" y="23" width="3" height="5" fill="#334155" />
        <rect x="11" y="27" width="4" height="2" fill="#1e293b" />
        <rect x="17" y="27" width="4" height="2" fill="#1e293b" />

        {/* 3. Torso Armor */}
        {armor ? (
          armorFam === 'iron' ? (
            <g>
              {/* Steel Plate Breastplate */}
              <rect x="11" y="13" width="10" height="9" fill="#94a3b8" />
              <rect x="12" y="14" width="8" height="7" fill="#cbd5e1" />
              <rect x="14" y="14" width="4" height="7" fill="#ffffff" />
              {/* Steel Pauldrons */}
              <rect x="9" y="12" width="3" height="4" fill="#64748b" />
              <rect x="20" y="12" width="3" height="4" fill="#64748b" />
              <rect x="9" y="12" width="1" height="1" fill="#ffffff" />
              <rect x="22" y="12" width="1" height="1" fill="#ffffff" />
            </g>
          ) : armorFam === 'gold' ? (
            <g>
              {/* Dragon Gold Armor */}
              <rect x="11" y="13" width="10" height="9" fill="#ca8a04" />
              <rect x="12" y="14" width="8" height="7" fill="#facc15" />
              <rect x="14" y="14" width="4" height="7" fill="#fef08a" />
              <rect x="15" y="16" width="2" height="2" fill="#ef4444" /> {/* Ruby Crest */}
              <rect x="9" y="12" width="3" height="4" fill="#eab308" />
              <rect x="20" y="12" width="3" height="4" fill="#eab308" />
            </g>
          ) : armorFam === 'robe' ? (
            <g>
              {/* Archmage Robe */}
              <rect x="11" y="13" width="10" height="12" fill="#312e81" />
              <rect x="12" y="14" width="8" height="11" fill="#4338ca" />
              <rect x="15" y="13" width="2" height="12" fill="#facc15" /> {/* Gold Stole */}
              <rect x="9" y="13" width="3" height="7" fill="#312e81" />
              <rect x="20" y="13" width="3" height="7" fill="#312e81" />
            </g>
          ) : (
            <g>
              {/* Hunter Studded Leather */}
              <rect x="11" y="13" width="10" height="9" fill="#78350f" />
              <rect x="12" y="14" width="8" height="7" fill="#9a3412" />
              <rect x="13" y="15" width="1" height="1" fill="#facc15" />
              <rect x="18" y="15" width="1" height="1" fill="#facc15" />
              <rect x="13" y="18" width="1" height="1" fill="#facc15" />
              <rect x="18" y="18" width="1" height="1" fill="#facc15" />
              <rect x="9" y="12" width="3" height="4" fill="#78350f" />
              <rect x="20" y="12" width="3" height="4" fill="#78350f" />
            </g>
          )
        ) : (
          <rect x="11" y="13" width="10" height="9" fill="#475569" />
        )}

        {/* 4. Head & Face (Authentic Pixel Portrait) */}
        {/* Head base */}
        <rect x="12" y="6" width="8" height="7" fill={skin} />
        <rect x="13" y="12" width="6" height="2" fill={skin} /> {/* Chin/Neck */}
        <rect x="12" y="10" width="8" height="2" fill={skinShadow} />

        {/* Warrior Eyes & Brow */}
        <rect x="13" y="8" width="2" height="1" fill="#451a03" />
        <rect x="17" y="8" width="2" height="1" fill="#451a03" />
        <rect x="13" y="9" width="1" height="1" fill="#0f172a" />
        <rect x="17" y="9" width="1" height="1" fill="#0f172a" />
        <rect x="14" y="9" width="1" height="1" fill="#ffffff" />
        <rect x="18" y="9" width="1" height="1" fill="#ffffff" />
        {/* Nose & Mouth */}
        <rect x="15" y="10" width="2" height="1" fill={skinShadow} />
        <rect x="15" y="11" width="2" height="1" fill="#991b1b" />

        {/* Hair Styles in Pixel Art */}
        {hairStyle === 'spiky' ? (
          <g>
            <rect x="11" y="5" width="10" height="3" fill={hair} />
            <rect x="12" y="3" width="2" height="3" fill={hair} />
            <rect x="15" y="2" width="2" height="4" fill={hair} />
            <rect x="18" y="3" width="2" height="3" fill={hair} />
            <rect x="10" y="6" width="2" height="4" fill={hair} />
            <rect x="20" y="6" width="2" height="4" fill={hair} />
            <rect x="15" y="3" width="1" height="1" fill={hairHighlight} />
          </g>
        ) : hairStyle === 'long' || hairStyle === 'ponytail' ? (
          <g>
            <rect x="11" y="4" width="10" height="4" fill={hair} />
            <rect x="10" y="6" width="2" height="9" fill={hair} />
            <rect x="20" y="6" width="2" height="9" fill={hair} />
            <rect x="13" y="4" width="6" height="1" fill={hairHighlight} />
            {hairStyle === 'ponytail' && (
              <rect x="22" y="7" width="3" height="6" fill={hair} />
            )}
          </g>
        ) : hairStyle !== 'bald' ? (
          <g>
            {/* Classic Short Trim */}
            <rect x="11" y="4" width="10" height="4" fill={hair} />
            <rect x="10" y="6" width="2" height="4" fill={hair} />
            <rect x="20" y="6" width="2" height="4" fill={hair} />
            <rect x="12" y="4" width="8" height="1" fill={hairHighlight} />
          </g>
        ) : (
          /* Bald / Monk Band */
          <rect x="12" y="7" width="8" height="1" fill="#ca8a04" />
        )}

        {/* 5. Equipped Pixel Shield on Left Arm (Viewer's left at x=3..8) */}
        {shield ? (
          shieldFam === 'aegis' ? (
            <g>
              <rect x="4" y="14" width="5" height="9" fill="#ca8a04" />
              <rect x="5" y="15" width="3" height="7" fill="#38bdf8" />
              <rect x="6" y="16" width="1" height="5" fill="#ffffff" />
            </g>
          ) : shieldFam === 'buckler' ? (
            <g>
              <rect x="4" y="15" width="6" height="6" fill="#b45309" />
              <rect x="5" y="16" width="4" height="4" fill="#d97706" />
              <rect x="6" y="17" width="2" height="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              <rect x="4" y="14" width="5" height="8" fill="#475569" />
              <rect x="5" y="15" width="3" height="6" fill="#94a3b8" />
              <rect x="5" y="21" width="3" height="2" fill="#475569" />
              <rect x="6" y="16" width="1" height="1" fill="#ffffff" />
            </g>
          )
        ) : null}

        {/* 6. Equipped Pixel Weapon in Right Hand (Viewer's right at x=23..30) */}
        {weaponFam === 'sword' ? (
          <g>
            {/* Gold Guard */}
            <rect x="22" y="17" width="3" height="2" fill="#facc15" />
            {/* Steel Blade */}
            <rect x="24" y="11" width="2" height="6" fill="#cbd5e1" />
            <rect x="24" y="11" width="1" height="6" fill="#ffffff" />
            <rect x="25" y="9" width="1" height="2" fill="#ffffff" />
            {/* Red Pommel */}
            <rect x="22" y="19" width="1" height="1" fill="#ef4444" />
          </g>
        ) : weaponFam === 'axe' ? (
          <g>
            <rect x="23" y="12" width="1" height="8" fill="#78350f" />
            <rect x="24" y="12" width="3" height="3" fill="#cbd5e1" />
            <rect x="26" y="11" width="1" height="4" fill="#ffffff" />
          </g>
        ) : weaponFam === 'hammer' ? (
          <g>
            <rect x="23" y="12" width="1" height="8" fill="#78350f" />
            <rect x="24" y="11" width="4" height="4" fill="#64748b" />
            <rect x="25" y="11" width="2" height="1" fill="#ffffff" />
          </g>
        ) : weaponFam === 'dagger' ? (
          <g>
            <rect x="22" y="16" width="2" height="1" fill="#facc15" />
            <rect x="23" y="12" width="1" height="4" fill="#ffffff" />
          </g>
        ) : weaponFam === 'bow' || weaponFam === 'crossbow' ? (
          <g>
            <rect x="24" y="11" width="1" height="9" fill="#92400e" />
            <rect x="23" y="10" width="1" height="2" fill="#facc15" />
            <rect x="23" y="19" width="1" height="2" fill="#facc15" />
            <rect x="22" y="12" width="1" height="7" fill="#e2e8f0" />
          </g>
        ) : (
          <g>
            {/* Arcane Staff */}
            <rect x="23" y="11" width="1" height="10" fill="#78350f" />
            <rect x="22" y="9" width="3" height="3" fill="#38bdf8" />
            <rect x="23" y="9" width="1" height="1" fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
};
export default VisualPaperdoll;
