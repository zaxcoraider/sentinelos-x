#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use odra::prelude::*;

#[odra::event]
pub struct ActionRecorded {
    pub agent: String,
    pub action: String,
    pub severity: u8,
    pub value: u64,
}

#[odra::module(events = [ActionRecorded])]
pub struct TreasuryGuard {
    total_actions: Var<u64>,
    last_action: Mapping<String, String>,
    last_severity: Mapping<String, u8>,
}

#[odra::module]
impl TreasuryGuard {
    pub fn record_action(&mut self, agent: String, action: String, severity: u8, value: u64) {
        let count = self.total_actions.get_or_default();
        self.total_actions.set(count + 1);
        self.last_action.set(&agent, action.clone());
        self.last_severity.set(&agent, severity);
        self.env().emit_event(ActionRecorded {
            agent,
            action,
            severity,
            value,
        });
    }

    pub fn total_actions(&self) -> u64 {
        self.total_actions.get_or_default()
    }

    pub fn last_action_of(&self, agent: String) -> Option<String> {
        self.last_action.get(&agent)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn record_action_increments_counter() {
        let env = odra_test::env();
        let mut guard = TreasuryGuard::deploy(&env, NoArgs);

        assert_eq!(guard.total_actions(), 0);

        guard.record_action("agent1".to_string(), "TRANSFER".to_string(), 1, 1000);
        assert_eq!(guard.total_actions(), 1);

        guard.record_action("agent1".to_string(), "WITHDRAW".to_string(), 3, 500);
        assert_eq!(guard.total_actions(), 2);
    }

    #[test]
    fn last_action_of_returns_latest() {
        let env = odra_test::env();
        let mut guard = TreasuryGuard::deploy(&env, NoArgs);

        guard.record_action("agentA".to_string(), "DEPOSIT".to_string(), 0, 200);
        guard.record_action("agentA".to_string(), "WITHDRAW".to_string(), 2, 50);

        assert_eq!(
            guard.last_action_of("agentA".to_string()),
            Some("WITHDRAW".to_string())
        );
    }

    #[test]
    fn last_action_of_unknown_agent_is_none() {
        let env = odra_test::env();
        let guard = TreasuryGuard::deploy(&env, NoArgs);
        assert_eq!(guard.last_action_of("nobody".to_string()), None);
    }

    #[test]
    fn record_action_emits_event() {
        let env = odra_test::env();
        let mut guard = TreasuryGuard::deploy(&env, NoArgs);

        guard.record_action("sentinel".to_string(), "ALERT".to_string(), 5, 9999);

        assert!(env.emitted_event(
            &guard,
            ActionRecorded {
                agent: "sentinel".to_string(),
                action: "ALERT".to_string(),
                severity: 5,
                value: 9999,
            }
        ));
        assert_eq!(env.events_count(&guard), 1);
    }

    #[test]
    fn multiple_agents_tracked_independently() {
        let env = odra_test::env();
        let mut guard = TreasuryGuard::deploy(&env, NoArgs);

        guard.record_action("alice".to_string(), "MINT".to_string(), 1, 100);
        guard.record_action("bob".to_string(), "BURN".to_string(), 2, 200);

        assert_eq!(
            guard.last_action_of("alice".to_string()),
            Some("MINT".to_string())
        );
        assert_eq!(
            guard.last_action_of("bob".to_string()),
            Some("BURN".to_string())
        );
        assert_eq!(guard.total_actions(), 2);
    }
}
