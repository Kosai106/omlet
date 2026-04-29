use std::env::current_dir;
use std::fs;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use clap::{ArgEnum, Parser, Subcommand};

use logger::{debug, info};
use omlet::module_resolver::ModuleResolver;
use relative_path::RelativePathBuf;
use utils::{glob, list_all_project_files};

mod analyze;
mod file_dates;
mod parse;

#[derive(Parser)]
#[clap(author, version, about, long_about = "\n")]
pub struct Cli {
    #[clap(subcommand)]
    command: Commands,
    /// Log level filter
    #[clap(short, long, arg_enum, default_value_t = LogLevel::Trace)]
    pub log_level: LogLevel,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ArgEnum)]
pub enum LogLevel {
    Off,
    Error,
    Warn,
    Info,
    Debug,
    Trace,
}

impl LogLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Off => "off",
            LogLevel::Error => "error",
            LogLevel::Warn => "warn",
            LogLevel::Info => "info",
            LogLevel::Debug => "debug",
            LogLevel::Trace => "trace",
        }
    }
}

#[derive(Subcommand)]
enum Commands {
    /// Parse .ts/.js files
    Parse {
        /// Root directory of the repository
        #[clap(short, long, default_value = ".")]
        root: String,
        /// Input file path
        #[clap(short, long)]
        input: Vec<String>,
        /// Input file path
        #[clap(short, long, default_value = "output")]
        output: String,
        /// Input code snippet to parse
        #[clap(short, long)]
        snippet: Option<String>,
        /// Ignore pattern
        #[clap(long)]
        ignore: Vec<String>,
        /// Alias config of the repository, which can be generated using `omlet alias-config`
        #[clap(long, default_value = "{}")]
        project_setup: String,
        /// Size of time window for git history processing (days)
        #[clap(short, long, default_value = "365")]
        day_limit: u64,
    },
    /// Parse .ts/.js files
    Analyze {
        /// Root directory of the repository
        #[clap(short, long, default_value = ".")]
        root: String,
        /// Input file path
        #[clap(short, long)]
        input: Vec<String>,
        /// Input file path
        #[clap(short, long, default_value = "output")]
        output: String,
        /// Ignore pattern
        #[clap(long)]
        ignore: Vec<String>,
        /// Alias config of the repository, which can be generated using `omlet alias-config`
        #[clap(long, default_value = "{}")]
        project_setup: String,
        /// Print summarized output instead of full result
        #[clap(long)]
        short: bool,
        /// Size of time window for git history processing (days)
        #[clap(short, long, default_value = "365")]
        day_limit: u64,
    },
    /// Expand glob patterns
    Glob {
        /// Root directory of the repository
        #[clap(short, long, default_value = ".")]
        root: String,
        /// Input glob pattern
        patterns: Vec<String>,
        /// Ignore pattern
        #[clap(long)]
        ignore: Vec<String>,
    },
    /// Extract file dates
    FileDates {
        /// Root directory of the repository
        #[clap(short, long, default_value = ".")]
        root: String,
        /// Size of time window for git history processing (days)
        #[clap(short, long)]
        day_limit: Option<u64>,
        /// Process all file types (only *.{jsx,js,tsx,ts} by default)
        #[clap(long)]
        no_file_filter: bool,
    },
}

fn create_output_dir(path: &Path) -> PathBuf {
    let output_dir = if Path::is_relative(path) {
        current_dir().unwrap().join(path)
    } else {
        path.to_path_buf()
    };

    fs::create_dir_all(&output_dir).unwrap_or_else(|_| panic!("Couldn't create output directory"));

    output_dir
}

impl Cli {
    pub fn init() -> Self {
        Cli::parse()
    }

    pub fn run(&self) {
        match &self.command {
            Commands::Parse {
                root,
                input,
                output,
                snippet,
                ignore,
                project_setup,
                day_limit,
            } => {
                info!("Running parse command");

                if !input.is_empty() {
                    let root = PathBuf::from(root);
                    let paths: Vec<RelativePathBuf> = glob(&root, input, ignore).unwrap().collect();
                    let output_dir = create_output_dir(&PathBuf::from(output));
                    let all_files: Vec<RelativePathBuf> =
                        list_all_project_files(&root).unwrap().collect();

                    let project_setup = serde_json::from_str(project_setup).unwrap();
                    let module_resolver = ModuleResolver::new(project_setup, &all_files);
                    debug!("Project setup: {:#?}", module_resolver);

                    parse::run(
                        &paths,
                        &root,
                        &output_dir,
                        &Rc::new(module_resolver),
                        *day_limit,
                    );
                } else if let Some(code_snippet) = snippet {
                    parse::run_on_string(code_snippet);
                }
            }
            Commands::Glob {
                root,
                patterns,
                ignore,
            } => {
                info!("Glob patterns: {:?}", patterns);

                let root = PathBuf::from(root);
                let paths = glob(&root, patterns, ignore).unwrap();

                for entry in paths {
                    println!("{:?}", entry)
                }
            }
            Commands::Analyze {
                root,
                input,
                output,
                ignore,
                project_setup,
                short,
                day_limit,
            } => {
                info!("Running analyze command");

                let root = PathBuf::from(root);
                let paths: Vec<RelativePathBuf> = glob(&root, input, ignore).unwrap().collect();
                let all_files: Vec<RelativePathBuf> =
                    list_all_project_files(&root).unwrap().collect();
                let project_setup = serde_json::from_str(project_setup).unwrap();
                let module_resolver = ModuleResolver::new(project_setup, &all_files);
                let output_dir = create_output_dir(&PathBuf::from(output));

                debug!("Alias map: {:#?}", module_resolver);
                analyze::run(
                    &paths,
                    &root,
                    &output_dir,
                    &Rc::new(module_resolver),
                    *short,
                    *day_limit,
                );
            }
            Commands::FileDates {
                root,
                day_limit,
                no_file_filter,
            } => {
                info!("Running file-dates command");

                let root = PathBuf::from(root);

                file_dates::run(&root, *day_limit, *no_file_filter);
            }
        }
    }
}
