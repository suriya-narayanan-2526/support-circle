import { supabase } from '../lib/supabase';

/**
 * Support Circle AI Intelligence Engine
 * Heuristic-based recommendation model that analyzes inventory gaps, 
 * facility capacity, and urgency levels to suggest optimal donation paths.
 */
export const aiRecommendationService = {
  
  /**
   * Generates a "Mission Intelligence" report suggesting what items are most needed.
   * Ranks categories based on a Gap Score: Actual Required (from Audits) - Available Platform Inventory.
   */
  async getSmartSuggestions() {
    try {
      const [orphanagesRes, requestsRes, auditsRes, donationsRes] = await Promise.all([
        supabase.from('orphanages').select('id, user_id, capacity'),
        supabase.from('orphan_requests').select('id, category, orphanage_id').eq('status', 'pending'),
        supabase.from('inventory_audits').select('orphanage_id, audit_data, created_at').eq('status', 'completed').order('created_at', { ascending: false }),
        supabase.from('donations').select('category, quantity').in('status', ['delivered', 'available'])
      ]);

      const orphanages = orphanagesRes.data || [];
      const requests = requestsRes.data || [];
      const audits = auditsRes.data || [];
      const donations = donationsRes.data || [];

      // 1. Calculate our global platform inventory (what we have)
      const globalInventory = {
        'Food': 0, 'Clothing': 0, 'Education': 0, 'Healthcare': 0, 'Electronics': 0
      };
      
      donations.forEach(d => {
        const cat = d.category || 'Food';
        if (globalInventory[cat] !== undefined) {
          globalInventory[cat] += (Number(d.quantity) || 0);
        }
      });

      // Initialize intelligence tracking
      const categoryIntelligence = {
        'Food': { score: 0, reason: '', target: null, globalStock: globalInventory['Food'], totalDeficit: 0 },
        'Clothing': { score: 0, reason: '', target: null, globalStock: globalInventory['Clothing'], totalDeficit: 0 },
        'Education': { score: 0, reason: '', target: null, globalStock: globalInventory['Education'], totalDeficit: 0 },
        'Healthcare': { score: 0, reason: '', target: null, globalStock: globalInventory['Healthcare'], totalDeficit: 0 },
        'Electronics': { score: 0, reason: '', target: null, globalStock: globalInventory['Electronics'], totalDeficit: 0 }
      };

      // 2. Process active requests (Direct demand acts as baseline priority)
      requests.forEach(req => {
        if (categoryIntelligence[req.category]) {
          categoryIntelligence[req.category].score += 30; 
          categoryIntelligence[req.category].target = req.orphanage_id;
          categoryIntelligence[req.category].requestId = req.id;
        }
      });

      // 3. Process latest Inventory Audits (Precise Deficit Analysis)
      // First, get only the latest audit per orphanage
      const latestAuditsMap = {};
      audits.forEach(a => {
        if (!latestAuditsMap[a.orphanage_id]) {
          latestAuditsMap[a.orphanage_id] = a;
        }
      });

      // Map audit item names to standard categories
      const mapItemToCategory = (name) => {
        const n = name.toLowerCase();
        if (n.includes('rice') || n.includes('food') || n.includes('dal') || n.includes('oil')) return 'Food';
        if (n.includes('book') || n.includes('pen') || n.includes('bag') || n.includes('edu')) return 'Education';
        if (n.includes('cloth') || n.includes('shirt') || n.includes('pant') || n.includes('uniform')) return 'Clothing';
        if (n.includes('med') || n.includes('health') || n.includes('pad') || n.includes('first aid')) return 'Healthcare';
        if (n.includes('laptop') || n.includes('computer') || n.includes('tablet') || n.includes('tech')) return 'Electronics';
        return 'Food'; // default
      };

      Object.values(latestAuditsMap).forEach(audit => {
        let items = audit.audit_data;
        if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) { items = []; }
        if (!Array.isArray(items)) return;

        items.forEach(item => {
          const deficit = Number(item.deficit) || 0;
          if (deficit > 0) {
            const cat = mapItemToCategory(item.name);
            if (categoryIntelligence[cat]) {
              categoryIntelligence[cat].totalDeficit += deficit;
            }
          }
        });
      });

      // 4. Calculate final AI Priority Score
      // Score = Base Request Score + (Total Deficit - Global Stock)
      Object.keys(categoryIntelligence).forEach(cat => {
        const intel = categoryIntelligence[cat];
        const gap = intel.totalDeficit - intel.globalStock;
        
        // Boost score if the deficit is larger than what we have
        if (gap > 0) {
          intel.score += (gap * 2); // Heavy weight for unfulfilled deficit
        } else if (intel.totalDeficit > 0) {
          intel.score += (intel.totalDeficit * 0.5); // Still a need, but we have stock
        }

        // Generate dynamic reasoning
        if (intel.totalDeficit > 0) {
          if (gap > 0) {
            intel.reason = `Critical Alert: AI calculation shows a network deficit of ${intel.totalDeficit} units vs our available inventory of ${intel.globalStock}. Urgent donations needed to cover the gap.`;
          } else {
            intel.reason = `Action Required: AI verifies orphanages need ${intel.totalDeficit} units. We have sufficient global stock (${intel.globalStock}), but dispatch is pending.`;
          }
        } else if (intel.score > 0) {
          intel.reason = `Demand detected from active requests despite stable audit metrics.`;
        } else {
          intel.reason = `Inventory levels appear stable based on recent audits.`;
        }
      });

      // Convert to ranked list
      return Object.entries(categoryIntelligence)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Top 3 suggestions

    } catch (err) {
      console.error('AI Suggestion Engine Error:', err);
      return [];
    }
  },

  /**
   * Tailors a CSR initiative suggestion for partners.
   */
  async suggestCsrInitiative() {
    const suggestions = await this.getSmartSuggestions();
    if (!suggestions.length) return null;

    const primary = suggestions[0];
    return {
      title: `${primary.category} Resilience Program`,
      description: `AI predictive model calculates a critical network deficit of ${primary.totalDeficit} ${primary.category.toLowerCase()} units based on real-time volunteer audits. A strategic investment here covers this gap efficiently.`,
      targetCategory: primary.category,
      impactScore: Math.floor(primary.score),
      priority: primary.score > 100 ? 'Critical' : 'High'
    };
  }
};
