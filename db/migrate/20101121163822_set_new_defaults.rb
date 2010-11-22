class SetNewDefaults < ActiveRecord::Migration
  def self.up
    # Set up default for the previous two migrations (thread_cleanup and
    # user_level)
    MsgThread.all.each do |thread|
        thread.pinned = false
        thread.save
    end

    Folder.all.each do |folder|
        folder.clearance = 0
        folder.save
    end

    User.all.each do |user|
        user.interest = ""
        user.save
    end
  end

  def self.down
  end
end