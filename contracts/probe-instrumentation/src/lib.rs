use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log;

declare_id!("5vn9WdV1trzRCW3zjPauKnMuQy61w11uq9ZgwjDqrLkj");

#[program]
pub mod probe_instrumentation {
    use super::*;

    /// Initialize monitoring for a program
    pub fn initialize(ctx: Context<Initialize>, program_id: Pubkey) -> Result<()> {
        let monitor = &mut ctx.accounts.monitor;
        monitor.program_id = program_id;
        monitor.owner = ctx.accounts.owner.key();
        monitor.total_events = 0;
        monitor.created_at = Clock::get()?.unix_timestamp;
        
        emit!(MonitorInitialized {
            program_id,
            owner: ctx.accounts.owner.key(),
            timestamp: monitor.created_at,
        });
        
        Ok(())
    }

    /// Log a custom event
    pub fn log_event(
        ctx: Context<LogEvent>,
        event_type: String,
        data: Vec<u8>,
    ) -> Result<()> {
        let monitor = &mut ctx.accounts.monitor;
        let timestamp = Clock::get()?.unix_timestamp;
        
        monitor.total_events += 1;
        
        // Emit event for Probe indexer to capture
        emit!(CustomEvent {
            program_id: monitor.program_id,
            event_type,
            data,
            timestamp,
            event_number: monitor.total_events,
        });
        
        Ok(())
    }

    /// Log function execution
    pub fn log_function(
        ctx: Context<LogEvent>,
        function_name: String,
        execution_time_us: u64,
        success: bool,
    ) -> Result<()> {
        let monitor = &mut ctx.accounts.monitor;
        let timestamp = Clock::get()?.unix_timestamp;
        
        monitor.total_events += 1;
        
        emit!(FunctionExecuted {
            program_id: monitor.program_id,
            function_name,
            execution_time_us,
            success,
            timestamp,
        });
        
        Ok(())
    }

    /// Log an error
    pub fn log_error(
        ctx: Context<LogEvent>,
        error_code: u32,
        error_message: String,
    ) -> Result<()> {
        let monitor = &mut ctx.accounts.monitor;
        let timestamp = Clock::get()?.unix_timestamp;
        
        monitor.total_events += 1;
        
        emit!(ErrorLogged {
            program_id: monitor.program_id,
            error_code,
            error_message,
            timestamp,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Monitor::INIT_SPACE,
        seeds = [b"monitor", program_id.as_ref()],
        bump
    )]
    pub monitor: Account<'info, Monitor>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    
    /// CHECK: This is the program being monitored
    pub program_id: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct LogEvent<'info> {
    #[account(
        mut,
        seeds = [b"monitor", monitor.program_id.as_ref()],
        bump
    )]
    pub monitor: Account<'info, Monitor>,
    
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Monitor {
    pub program_id: Pubkey,
    pub owner: Pubkey,
    pub total_events: u64,
    pub created_at: i64,
}

// Events
#[event]
pub struct MonitorInitialized {
    pub program_id: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CustomEvent {
    pub program_id: Pubkey,
    #[index]
    pub event_type: String,
    pub data: Vec<u8>,
    pub timestamp: i64,
    pub event_number: u64,
}

#[event]
pub struct FunctionExecuted {
    pub program_id: Pubkey,
    #[index]
    pub function_name: String,
    pub execution_time_us: u64,
    pub success: bool,
    pub timestamp: i64,
}

#[event]
pub struct ErrorLogged {
    pub program_id: Pubkey,
    pub error_code: u32,
    pub error_message: String,
    pub timestamp: i64,
}
