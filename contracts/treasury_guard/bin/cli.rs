use odra::host::HostEnv;
use odra_cli::{deploy::DeployScript, DeployedContractsContainer, OdraCli};

pub struct TreasuryDeploy;

impl DeployScript for TreasuryDeploy {
    fn deploy(
        &self,
        _env: &HostEnv,
        _container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
        Ok(())
    }
}

pub fn main() {
    OdraCli::new()
        .about("CLI for TreasuryGuard contract")
        .deploy(TreasuryDeploy)
        .build()
        .run();
}
