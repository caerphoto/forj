class Folder < ActiveRecord::Base
    has_many :msg_threads
end
